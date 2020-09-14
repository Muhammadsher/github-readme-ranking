const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Joi = require("joi");

const express = require("express");
const router = express.Router();

const generateStat = (firstFive, profile_info, value, cb) => {
  if (profile_info.length <= 0) {
    profile_info.push({
      rank: "256+",
      login: value.username,
      name: value.username,
      contributions: "-",
    });
  }

  profile_info = profile_info[0];

  if (!firstFive.find((e) => e.login == profile_info.login)) {
    firstFive[firstFive.length - 2].rank = "";
    firstFive[firstFive.length - 2].login = "...";
    firstFive[firstFive.length - 2].name = "...";
    firstFive[firstFive.length - 2].contributions = "";
    firstFive[firstFive.length - 1].rank = profile_info.rank;
    firstFive[firstFive.length - 1].login = profile_info.login;
    firstFive[firstFive.length - 1].contributions = profile_info.contributions;
    firstFive[firstFive.length - 1].name = profile_info.name;
  }

  let rankLine = fs.readFileSync(
    path.join(__dirname, "../files/rankLine.svg"),
    "utf-8"
  );
  let rank = fs.readFileSync(
    path.join(__dirname, "../files/rank.svg"),
    "utf-8"
  );

  let svg = {
    translate: 0,
    delay: 450,
    rank: "",
    name: "Muhammadsher",
    contributions: "",
    rankText: 22,
  };
  let svgBody = "";

  firstFive.forEach((e) => {
    let tmp = rankLine.replace(/\$1/g, svg.translate);
    tmp = tmp.replace(/\$2/g, svg.delay);
    tmp = tmp.replace(/\$3/g, e.rank ? e.rank : svg.rank);
    tmp = tmp.replace(/\$4/g, e.name ? e.name : e.login ? e.login : svg.name);
    tmp = tmp.replace(
      /\$6/g,
      e.rank > 99
        ? e.rank == "256+"
          ? 37
          : 30
        : e.rank == "256+"
        ? 37
        : svg.rankText
    );
    tmp = tmp.replace(
      /\$5/g,
      e.contributions ? e.contributions : svg.contributions
    );
    svgBody += tmp;
    svg.translate = svg.translate + 25;
    svg.delay = svg.delay + 150;
  });

  rank = rank.replace(
    /\$1/g,
    `${profile_info.name}'s GitHub rank in ${
      value.country.charAt(0).toUpperCase() + value.country.slice(1)
    }`
  );

  rank = rank.replace(/\$2/g, svgBody);
  let outPut = path.join(__dirname, "../svgs", `${profile_info.login}.svg`);
  fs.writeFileSync(outPut, rank);
  cb(outPut);
};

const getUsers = async (cb) => {
  let users = await axios.get("https://commiters.now.sh/rank/uzbekistan");
  cb(users);
};

router.get("/", (req, res) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    country: Joi.string().required(),
    show_private: Joi.boolean().default(false),
  });

  const { error, value } = schema.validate(req.query);
  if (error) return res.sendStatus(400);

  const svgPath = path.join(__dirname, "../svgs", `${value.username}.svg`);
  if (fs.existsSync(svgPath)) return res.sendFile(svgPath);

  getUsers((data) => {
    const { users } = data.data;
    const allUsers = value.show_private ? users.private_users : users.users;
    const firstFive = allUsers.slice(0, 5);
    const profile_info = allUsers.filter((e) => e.login == value.username);
    generateStat(firstFive, profile_info, value, (d) => {
      res.sendFile(d);
    });
  });
});

module.exports = router;
