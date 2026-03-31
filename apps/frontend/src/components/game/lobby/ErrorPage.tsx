/**
 * Component for page, that is served in case the Servers state machine
 * reaches an invalid state
 */
export default function ErrorPage() {
  return (
    <div>
      <h1>Error, the state machine reached an invalid state</h1>
    </div>
    );
}
