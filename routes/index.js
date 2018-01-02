var express = require('express');
var router = express.Router();
var cand = require("../models/candidates")
var path = require("path")
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render("index")
});


router.post("/vote/add", (req, res) => {
  var userid = req.body.userid
  var candname = req.body.candname
  if (!userid || !candname) {
    res.json({ status: 201, msg: "Missing details" })
  }
  else {
    cand.addVote(userid, candname)
      .then((msg) => {
        res.json({ status: 200, msg: msg })
      })
      .catch((err) => {
        res.json({ status: 201, msg: err })
      })
  }
})



router.post("/vote/candidate/", (req, res) => {
  var name = req.body.candname
  if (!name) {
    res.json({ status: 201, msg: "Missing details" })
  }
  else {
    cand.countVoteForCandidate(name)
      .then((msg) => {
        res.json({ status: 200, msg: msg })
      })
      .catch((err) => {
        res.json({ status: 201, msg: err })
      })
  }
})


router.post("/vote/total/", (req, res) => {
  cand.totalVotes()
    .then((msg) => {
      res.json({ status: 200, msg: msg })
    })
    .catch((err) => {
      res.json({ status: 201, msg: err })
    })
})



router.post("/vote/follow/", (req, res) => {
  var userid = req.body.userid
  if (!userid) {
    res.json({ status: 201, msg: "Missing details" })
  }
  else {
    cand.followYourVote(userid)
      .then((msg) => {
        res.json({ status: 200, msg: msg })
      })
      .catch((err) => {
        res.json({ status: 201, msg: err })
      })
  }
})


router.post("/vote/inspect/", (req, res) => {
  cand.inspection()
    .then((msg) => {
      res.json({ status: 200, msg: msg })
    })
    .catch((err) => {
      res.json({ status: 201, msg: err })
    })
})



router.post("/vote/change/", (req, res) => {
  var name = req.body.candname
  var userid = req.body.userid
  if (!name || !userid) {
    res.json({ status: 201, msg: "Missing details" })
  }
  else {
    cand.changeVote(userid, name)
      .then((msg) => {
        res.json({ status: 200, msg: msg })
      })
      .catch((err) => {
        res.json({ status: 201, msg: err })
      })
  }
})



router.post("/vote/all/", (req, res) => {
  cand.allVotes()
    .then((msg) => {
      res.json({ status: 200, msg: msg })
    })
    .catch((err) => {
      res.json({ status: 201, msg: err })
    })
})

module.exports = router;
