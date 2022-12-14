# Mongo DB Example 
In this repository we are trying to create a practical implementation of mongodb with docker.
It includes:
- Mongo db full configurable (users, mongod.conf, autorizathion, bindIP, and more)
- Scripts runned with crontab for auto cleaning
- a docker for auto backups
- a docker that can be used as a browser

I hope it helps you :)

# Mongo DB Tests
There is a file that can be run in jupyter notebook and let us see that everything is working fine.
This project was tested by myself.
# Mongo DB Authentication Explanation

This documentation is created with the porpose of learning how to manage mongo Db authentication.

Remember that authentication (authn) is the process of verifying the identity of an entity, while authorization (authz) relates to granting or denying specific access requests to resources (database collections, for example).

### Types of users:
In this case we'll see two kind of users: 

- the first one will be an admin user. It’s going to have permissions for managing users on every database of the MongoDB instance, and you will use this user only with the mongo CLI. The role that will be given to this user is called userAdminAnyDatabase. You can find the details of it here;
- the other user will be the owner of a single database, and it’s going to have read and write privileges on the database. You can create as many users as you want, so that every database will have its own user. You will use this user account in your applications to connect to the database of your interest. The details for the dbOwner role are available here, but what you need to know is that it’s a combination of roles that allows to create collections and read and write data in a database.

Note that the role “admin” differs from the role “owner”. A *database admin* is able to perform administrative operations on the database, like creating a new collection, dropping it, viewing stats. A *user admin* is able to manage users for a specific database. A *database owner* has all the privileges listed above, plus the full read and write permission on the database.
### Where are the users stored? 

The first component that I always seem to forget about is the admin database, which stores authentication and authorisation details. User details are stored in the system.users collection, in the following format:
```json
{
  _id: <system defined id>,
  user: "<name>",
  db: "<database>",
  credentials: { <authentication credentials - a bit out of scope for this post> },
  roles: [
           { role: "<role name>", db: "<database>" },
           ...
         ],
  customData: <custom information>
 }
```

The db field specifies the primary database associated with the user. The same user can have access to other databases using the roles array.

## Creating Users (Docker Way)

When you start the mongo image, you can adjust the initialization of the MongoDB instance by passing one or more environment variables on the docker run command line. Do note that none of the variables below will have any effect if you start the container with a data directory that already contains a database: any pre-existing database will always be left untouched on container startup.

MONGO_INITDB_ROOT_USERNAME, MONGO_INITDB_ROOT_PASSWORD
These variables, used in conjunction, create a new user and set that user's password. This user is created in the admin authentication database and given the role of root, which is a "superuser" role.

The following is an example of using these two variables to create a MongoDB instance and then using the mongosh cli (use mongo with 4.x versions) to connect against the admin authentication database.

Both variables are required for a user to be created. If both are present then MongoDB will start with authentication enabled (mongod --auth).

Authentication in MongoDB is fairly complex, so more complex user setup is explicitly left to the user via /docker-entrypoint-initdb.d/ (see the Initializing a fresh instance and Authentication sections below for more details).

MONGO_INITDB_DATABASE
This variable allows you to specify the name of a database to be used for creation scripts in /docker-entrypoint-initdb.d/*.js (see Initializing a fresh instance below). MongoDB is fundamentally designed for "create on first use", so if you do not insert data with your JavaScript files, then no database is created.

### admin user 
So we will create the admin directly from our docker file.
### other users: 
We will create them with a "mongo-init.js" file in entrypoint-initdb.d
```bash
print("Started Adding the Users.");
db = db.getSiblingDB("project");
db.createUser({
  user: "writer",
  pwd: "1234",
  roles: [{ role: "readWrite", db: "project" }],
});

db.createUser({
  user: "reader",
  pwd: "1234",
  roles: [{ role: "read", db: "project }],
});
print("End Adding the User Roles.");
z
```

## Creating Users (Manual Way)

Let’s start, for real, by creating the actual users. Open your mongo shell and switch to the admin database:

```bash
mongo
```

```bash
use admin
```
```bash
db.createUser({ user: "admin", pwd: "adminpassword", roles: [{ role: "userAdminAnyDatabase", db: "admin" }] })
```


In this case we’re giving the user the userAdminAnyDatabase role. This means that the admin user will be able manage (create, update, delete) users on all the databases of the MongoDB instance.

Make sure you use a safe password for the admin user, preferably generated by a password manager.

You can check that the user has been correctly created with this command:

```bash
db.auth("admin", "adminpassword")
```

### Mongod.conf and enable authentication

We are now going to enable authentication on the MongoDB instance, by modifying the mongod.conf file. If you’re on Linux:

```bash
sudo nano /etc/mongod.conf
```
Add these lines at the bottom of the YAML config file:

```bash
security:
    authorization: enabled
```

This will enable authentication on your database instance. With nano, save with CTRL+X and confirm with y.

Now restart the mongod service (Ubuntu syntax).



```bash
sudo service mongod restart
```
You can check if the service is up with:


```bash
sudo service mongod status
```

Let’s go back in the mongo shell. Switch to the database admin and authenticate with the previously created user (called “admin”). Given that the user has the “userAdmin” role, it will be able to create and manage other users.


```bash
use admin
db.auth("admin", "adminpassword")
```
Now we will switch to an already created database and create a new user specifically for the database.

The following command will create an user with the role of dbOwner on the database. The dbOwner role will give to the user read and write permissions on all the collections of the database. Read more here.

```bash
use yourdatabase
db.createUser({ user: "youruser", pwd: "yourpassword", roles: [{ role: "dbOwner", db: "yourdatabase" }] })
```
Check that everything went fine by trying to authenticate, with the db.auth(user, pwd) function.

You can also use: read/readWrite in a role.
```bash
db.auth("youruser", "yourpassword")
show collections
```
When connecting with your favourite MongoDB Client from an application, use a connection string that will look like this:

```bash
mongodb://youruser:yourpassword@localhost/yourdatabase
```
## Protecting from external access
We’re now going to check that the MongoDB instance is listening on the local loopback interface only. This means that the DBMS will be accepting connections to the databases only when they come from the host itself.

You can of course adapt this to your needs, for example by enabling access on a private network interface, but the important thing to understand is that you should carefully decide which interfaces MongoDB should listen on. You should therefore avoid to expose the instance on the Internet if you don’t require to access it from the outside. And even if you do, there are much better ways to do that, for example by using an SSH tunnel. But that’s another story.

So, open mongod.conf in edit mode again, as we’re going to check out the net.bindIp option. That option tells the mongod process on which interfaces it should listen.
```bash
net:
    bindIp: 127.0.0.1
```
With this configuration, MongoDB will listen on 127.0.0.1 only (localhost). It means that you’ll be able to connect to your database only from the local machine.
```bash
net:
    bindIp: 0.0.0.0
```
With this configuration, MongoDB will be listening on 0.0.0.0 (“all the networks”). It means that mongod will listen on all the interfaces configured on your system. Pay attention that in this way you are likely going to allow everyone on the Internet to access your database (as far as they have the credentials, of course, so pay particular attention to poor passwords).

You can also make MongoDB listen on more than one interface, by separing them with commas. This is useful if you want to make MongoDB listen on localhost and a private network interface.
```bash
net:
    bindIp: 127.0.0.1,172.21.200.200
```
```bash
```


## Bibliography
### Mediums 
- [Everything I needed to know about MongoDB user permissions, but couldn’t find in a single stackoverflow post…](https://medium.com/@readikus/everything-i-needed-to-know-about-mongodb-user-permissions-but-couldnt-find-in-a-single-f5272305ebf4)

- [How to setup user authentication in MongoDB 4.0](https://matteocontrini.medium.com/how-to-setup-auth-in-mongodb-3-0-properly-86b60aeef7e8)

- [Use case: add an init script to the Docker official Mongo image
](https://julien-bouffard.medium.com/use-case-add-an-init-script-to-the-docker-official-mongo-image-be58cb2dff25)
### others
- [Mongo docker](https://hub.docker.com/_/mongo)
