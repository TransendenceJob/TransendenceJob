#!/usr/bin/env python3
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request


GRAFANA_URL = os.environ.get("GRAFANA_URL", "http://grafana:3000").rstrip("/")
GRAFANA_USER = os.environ.get("GRAFANA_ADMIN_USER", "admin")
GRAFANA_PASSWORD = os.environ.get("GRAFANA_ADMIN_PASSWORD", "admin")
CONFIG_PATH = os.environ.get(
    "GRAFANA_COMMUNITY_DASHBOARDS",
    "/opt/grafana/community-dashboards.json",
)
WAIT_SECONDS = int(os.environ.get("GRAFANA_IMPORT_WAIT_SECONDS", "120"))
RETIRED_DASHBOARD_UIDS = [
    "community-docker-system-monitoring",
]


def auth_headers():
    token = base64.b64encode(
        f"{GRAFANA_USER}:{GRAFANA_PASSWORD}".encode("utf-8")
    ).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def request_json(url, data=None, headers=None):
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers=headers or {"Accept": "application/json"},
        method="GET" if body is None else "POST",
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def wait_for_grafana():
    deadline = time.time() + WAIT_SECONDS
    while time.time() < deadline:
        try:
            request_json(f"{GRAFANA_URL}/api/health", headers=auth_headers())
            return
        except Exception:
            time.sleep(2)
    raise TimeoutError(f"Grafana was not healthy after {WAIT_SECONDS}s")


def download_dashboard(item):
    revision = item.get("revision", "latest")
    url = (
        "https://grafana.com/api/dashboards/"
        f"{item['gnetId']}/revisions/{revision}/download"
    )
    return request_json(url)


def replace_datasources(value, datasource_name, datasource_uid):
    if isinstance(value, dict):
        if value.get("type") == "prometheus" and "uid" in value:
            value["uid"] = datasource_uid
        for key, nested in list(value.items()):
            value[key] = replace_datasources(nested, datasource_name, datasource_uid)
        return value
    if isinstance(value, list):
        return [
            replace_datasources(nested, datasource_name, datasource_uid)
            for nested in value
        ]
    if isinstance(value, str):
        placeholders = {
            "${DS_PROMETHEUS}",
            "$DS_PROMETHEUS",
            "${PROMETHEUS}",
            "$PROMETHEUS",
        }
        if value in placeholders:
            return datasource_name
    return value


def dashboard_inputs(dashboard, datasource_name):
    inputs = []
    for item in dashboard.get("__inputs", []):
        if item.get("type") == "datasource":
            inputs.append(
                {
                    "name": item.get("name"),
                    "type": "datasource",
                    "pluginId": item.get("pluginId", "prometheus"),
                    "value": datasource_name,
                }
            )
    return inputs


def import_dashboard(item):
    dashboard = download_dashboard(item)
    datasource = item.get("datasource", "Prometheus")
    datasource_uid = item.get("datasourceUid", "prometheus")

    dashboard["id"] = None
    dashboard["uid"] = item["uid"]
    dashboard["tags"] = sorted(
        set(dashboard.get("tags", []) + ["community", "transendence"])
    )
    dashboard = replace_datasources(dashboard, datasource, datasource_uid)

    payload = {
        "dashboard": dashboard,
        "overwrite": True,
        "inputs": dashboard_inputs(dashboard, datasource),
    }

    try:
        request_json(
            f"{GRAFANA_URL}/api/dashboards/import",
            data=payload,
            headers=auth_headers(),
        )
    except urllib.error.HTTPError as error:
        # Some dashboard exports are already concrete enough for the stable API.
        if error.code not in {400, 404, 412}:
            raise
        request_json(
            f"{GRAFANA_URL}/api/dashboards/db",
            data={"dashboard": dashboard, "overwrite": True},
            headers=auth_headers(),
        )

    print(f"Imported Grafana dashboard {item['gnetId']}: {item['name']}")


def delete_retired_dashboard(uid):
    req = urllib.request.Request(
        f"{GRAFANA_URL}/api/dashboards/uid/{uid}",
        headers=auth_headers(),
        method="DELETE",
    )
    try:
        with urllib.request.urlopen(req, timeout=30):
            print(f"Removed retired Grafana dashboard uid={uid}")
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise


def main():
    with open(CONFIG_PATH, "r", encoding="utf-8") as config_file:
        dashboards = json.load(config_file)

    wait_for_grafana()
    for uid in RETIRED_DASHBOARD_UIDS:
        delete_retired_dashboard(uid)
    for item in dashboards:
        import_dashboard(item)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Grafana community dashboard import failed: {exc}", file=sys.stderr)
        raise
