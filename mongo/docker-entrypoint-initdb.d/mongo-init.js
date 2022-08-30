print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ Started Adding the Users. ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");

db.createUser({
  user: "writer",
  pwd: "1234",
  roles: [{ role: "readWrite", db: "test" }],
});

db.createUser({
  user: "reader",
  pwd: "1234",
  roles: [{ role: "read", db: "test" }],
});
print("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ End Adding the User Roles. +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
