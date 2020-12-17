const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Joi = require("joi");
const renderError = require("../src/common/util");
const theme = require("../themes/theme.json")

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

    let _theme = theme[value.theme]

    console.log(_theme)
    rank = rank.replace(/\$3/g, _theme.bgColor);
    rank = rank.replace(/\$hfill/g, _theme.headerColor);
    rank = rank.replace(/\$stroke/g, _theme.digitColor);
    rankLine = rankLine.replace(/\$lc/g, _theme.digitColor);
    rankLine = rankLine.replace(/\$row/g, _theme.rowColor);
    rankLine = rankLine.replace(/\$commits/g, _theme.commitColor);
    if (value.theme == 'dark') {
        rank = rank.replace(/\$hideLight/g, "display: none");
        rank = rank.replace(/\$hideDark/g, "");
    } else {
        rank = rank.replace(/\$hideLight/g, "");
        rank = rank.replace(/\$hideDark/g, "display: none");
    };

    firstFive.forEach((e) => {
        let tmp = rankLine.replace(/\$1/g, svg.translate);
        tmp = tmp.replace(/\$2/g, svg.delay);
        tmp = tmp.replace(/\$3/g, e.rank ? e.rank : svg.rank);
        tmp = tmp.replace(/\$4/g, e.name ? e.name : e.login ? e.login : svg.name);
        tmp = tmp.replace(
            /\$6/g,
            e.rank > 99 ?
            e.rank == "256+" ?
            37 :
            30 :
            e.rank == "256+" ?
            37 :
            svg.rankText
        );
        tmp = tmp.replace(
            /\$5/g,
            e.contributions ? e.contributions : svg.contributions
        );
        svgBody += tmp;
        svg.translate = svg.translate + 25;
        svg.delay = svg.delay + 150;
    });

    value.country_code = value.country_code.split("_").join(" ");
    rank = rank.replace(
        /\$1/g,
        `${profile_info.name}'s GitHub rank in ${
      value.country_code.charAt(0).toUpperCase() + value.country_code.slice(1)
    }`
    );

    value.theme = value.theme.split();

    rank = rank.replace(/\$2/g, svgBody);
    cb(rank);
};

const getUsers = async(value, cb) => {
    let users = await axios.get(
        `https://commiters.now.sh/rank/${value.country_code}`
    );
    cb(users);
};

const clampValue = (number, min, max) => {
    return Math.max(min, Math.min(number, max));
};

module.exports = async(req, res) => {
    const schema = Joi.object({
        username: Joi.string().required(),
        country_code: Joi.string().required(),
        show_private: Joi.boolean().default(false),
        cache_seconds: Joi.number(),
        theme: Joi.string().optional().valid("light", "dark").default("light"),
    });

    const { error, value } = schema.validate(req.query);
    if (error)
        return res.send(renderError("Bad request", "Provide required parametres"));

    const cacheSeconds = clampValue(
        parseInt(value.cache_seconds || 86400, 10),
        86400,
        86400 * 2
    );
    let newRequest = true;
    value.country_code = value.country_code.replace(/ /g, "_").toLowerCase();
    value.theme = value.theme.toLowerCase();
    getUsers(value, (data) => {
        const { users } = data.data;
        if (!users)
            return res.send(
                renderError("User not found", "User with provided username not found")
            );
        const allUsers = value.show_private ? users.private_users : users.users;
        const firstFive = allUsers.slice(0, 5);
        const profile_info = allUsers.filter((e) => e.login == value.username);
        generateStat(firstFive, profile_info, value, (d) => {
            if (newRequest) {
                res.setHeader("Content-Type", "image/svg+xml");
                res.setHeader("Cache-Control", `public, max-age=${cacheSeconds}`);
                res.send(d);
            }
        });
    });
};