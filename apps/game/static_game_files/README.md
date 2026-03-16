This folder holds the BabylonJs files that will be sent to the Client.

Once loading phase is finished, Client will make html request for the client script.
The request will be given to the nginx, which will serve theese files directly.
The Nginx shares the folder with theese scripts through a volume with the gameserver.

