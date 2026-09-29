# Put the app online (Render)

1. Put this whole folder on GitHub (new repository, then "uploading an existing file").
2. On https://render.com sign up, choose New > Web Service, connect the repository.
3. Language: Docker. Choose the plan (see below). Click Deploy.
4. When it finishes, Render shows your public address (https://something.onrender.com).

Plans: Free has no saved disk, so tasks can reset, and it sleeps after ~15 minutes idle.
To keep tasks: use a paid plan that offers a disk, add a Disk mounted at /data (1 GB is plenty).

Warning: there is no login. Anyone with the address can change the list.
