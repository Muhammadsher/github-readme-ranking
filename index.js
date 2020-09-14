const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "README.md");
const axios = require("axios");

const username = "Muhammadsher";
const show_private = true;

const generateStat = (user) => {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return console.log(err);
    }
    let result = data.replace(
      /<!-- User's id will be generated here -->/g,
      user.name + " " + user.rank
    );

    fs.writeFile(filePath, result, "utf8", (err) => {
      if (err) return console.log(err);
    });
  });
};

const getUsers = async (cb) => {
  let users = await axios.get("https://commiters.now.sh/rank/uzbekistan");
  cb(users);
};

console.log(
  getUsers((data) => {
    const { users } = data.data.users;
    const private_users = show_private ? data.data.users.private_users : [];
    const public_info = users.filter((e) => e.login == username);
    const private_info = private_users.filter((e) => e.login == username);
    console.log(public_info);
    console.log(private_info);
    generateStat(private_info[0]);
  })
);
