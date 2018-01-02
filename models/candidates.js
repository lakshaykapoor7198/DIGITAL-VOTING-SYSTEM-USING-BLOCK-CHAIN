var mongoose = require("mongoose")
var SHA256 = require("crypto-js/sha256");
mongoose.connect("mongodb://127.0.0.1/ivoting")

var cand = mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	userid: {
		type: String,
		required: true
	},
	time: {
		type: String,
		required: true
	},
	prevhash: {
		type: String,
		required: true
	},
	hash: {
		type: String,
		required: true
	},
	nonce: {
		type: String,
		required: true
	}
})

var Candidate = mongoose.model("Candidate", cand, "candidates")
exports.Candidate = Candidate


function CalculateHash(id, time, name, prevhash) {
	//return nonce and hash
	for (i = 0; i < 500000; i++) {
		str = i + id + time + name + prevhash
		hash = sha256(str)
		//hash = SHA256(str).toString()
		//console.log(hash)
		if (hash.substring(0, 4) == "0000") {
			return [i, hash]
			break;
		}
	}
}





var addVote = (userid, candname) => {
	return new Promise((resolve, reject) => {
		var userId = userid
		var cand = candname
		var date = new Date()
		var time = date.getTime()
		//Find most recent vote and get its hash and calc new hash and add to it
		Candidate.find({ name: cand }).sort({ 'created_at': -1 }).exec((err, latest) => {
			if (err) {
				reject(err)
			}
			else if (!latest) {
				reject("No genesis block found!")
			}
			else {
				var prevhash = latest[latest.length - 1].hash
				var h = CalculateHash(userId, time, cand, prevhash)
				var vote = {
					name: cand,
					userid: userid,
					time: time,
					prevhash: prevhash,
					hash: h[1],
					nonce: h[0]
				}
				newVote = new Candidate(vote)
				newVote.save((err, saved) => {
					if (err || !saved) {
						reject(err)
					}
					else {
						var msg = { msg: "Block added", data: saved }
						console.log(msg)
						resolve(msg)
					}
				})
			}
		})
	})
}


exports.addVote = addVote

var countVoteForCandidate = (name) => {
	return new Promise((resolve, reject) => {
		Candidate.find({ name: name }).sort({ 'created_at': -1 }).exec((err, votes) => {
			if (err) {
				reject(err)
			}
			else if (!votes) {
				reject("Candidate not found")
			}
			else {
				var dictionary = {}
				for (i = 0; i < votes.length; i++) {
					if (votes[i].userid != "000000") {
						dictionary[votes[i].userid] = votes[i].time
						if (i == votes.length - 1) {
							//console.log(dictionary)
							resolve({ dictionary: dictionary, name: name })
						}
					}
				}
			}
		})
	})
}

exports.countVoteForCandidate = countVoteForCandidate


var totalVotes = () => {
	return new Promise((resolve, reject) => {
		Candidate.find().distinct('name', (err, cands) => {
			if (err) {
				reject(err)
			}
			else if (!cands) {
				reject("Candidate not found")
			}
			else {

				var votes = {}
				j = 0
				for (i = 0; i < cands.length; i++) {
					// console.log(cands[i])
					countVoteForCandidate(cands[i])
						.then((data) => {

							cVotes = data.dictionary
							name = data.name
							for (var keys in cVotes) {
								if (!(keys in votes)) {
									votes[keys] = [cVotes[keys], name]
								}
								else {
									if (parseInt(votes[keys][0]) < parseInt(cVotes[keys])) {
										votes[keys] = [cVotes[keys], name]
									}
								}
							}
							if (j == cands.length - 1) {
								// console.log(votes)
								resolve(votes)
							}
							j += 1
						})
						.catch((err) => {
							reject(err)
						})

				}
			}
		})
	})
}

exports.totalVotes = totalVotes


followYourVote = (id) => {
	return new Promise((resolve, reject) => {
		totalVotes()
			.then((votes) => {
				console.log(votes[id])
				resolve(votes[id])
			})
			.catch((err) => {
				reject(err)
			})
	})
}

exports.followYourVote = followYourVote



inspection = () => {
	return new Promise((resolve, reject) => {
		Candidate.find({}, (err, votes) => {
			if (err) {
				reject(err)
			}
			else if (!votes) {
				console.log({ code: 0, msg: "No votes till now!" })
				resolve({ code: 0, msg: "No votes till now!" })
			}
			else {
				badVotes = []
				for (i = 0; i < votes.length; i++) {
					if (votes[i].hash.substring(0, 4) != "0000") {
						badVotes.push(votes[i])
					}
					if (i == votes.length - 1 && badVotes.length == 0) {
						console.log({ code: 2, msg: "Safe!" })
						resolve({ code: 2, msg: "Safe!" })
					}
					else if (i == votes.length - 1 && badVotes.length > 0) {
						console.log({ code: 1, vote: badVotes })
						resolve({ code: 1, vote: badVotes })
					}
				}
			}
		})
	})
}


exports.inspection = inspection



changeVote = (userid, cToName) => {
	return new Promise((resolve, reject) => {
		totalVotes()
			.then((votes) => {
				vote = votes[userid]
				time = vote[0]
				name = vote[1]
				Candidate.findOne({ time: time, name: name }, (err, vote) => {
					if (err) {
						reject(err)
					}
					else if (!vote) {
						reject("No such vote")
					}
					else {
						prevhash = vote.prevhash
						hashToBeChanged = vote.hash
						var h = sha256(vote.nonce + userid + time + cToName + prevhash)
						Candidate.findOneAndUpdate({ time: time, name: name }, { $set: { name: cToName, hash: h } }, { new: true }, (err, cVote) => {
							if (cVote) {
								//Update chain
								updateChain(hashToBeChanged, h)
								console.log({ "msg": "Vote changed", vote: cVote })
								resolve({ "msg": "Vote changed", vote: cVote })
							}
							else {
								reject(err)
							}
						})
					}
				})
			})
			.catch((err) => {
				reject(err)
			})
	})
}


exports.changeVote = changeVote


updateChain = (prevHash, newPrevHash) => {
	return new Promise((resolve, reject) => {
		Candidate.findOne({ prevhash: prevHash }, (err, vote) => {
			if (err) {
				reject(err)
			}
			else if (!vote) {
				console.log({ code: 0, msg: "End of chain" })
				resolve({ code: 0, msg: "End of chain" })
			}
			else {
				name = vote.name
				id = vote.userid
				hashToBeChanged = vote.hash
				time = vote.time
				newH = sha256(vote.nonce + id + time + name + newPrevHash)
				Candidate.findOneAndUpdate({ prevhash: prevHash }, { $set: { hash: newH, prevhash: newPrevHash } }, { new: true }, (err, cVote) => {
					if (cVote) {
						//Update chain
						updateChain(hashToBeChanged, newH)
						console.log({ "msg": "Chain updated", vote: cVote })
						resolve({ "msg": "Chain updated", vote: cVote })
					}
					else {
						reject(err)
					}
				})
			}
		})
	})
}


allVotes = () => {
	return new Promise((resolve, reject) => {
		all = {}
		Candidate.find().distinct("name", (err, cands) => {
			if (err) {
				reject(err)
			}
			else if (!cands) {
				reject("No Candidate")
			}
			else {
				j = 0;
				for (i = 0; i < cands.length; i++) {
					Candidate.find({ name: cands[i] }).exec((err, votes) => {
						all[votes[0].name] = votes
						if (j == cands.length - 1) {
							console.log(all)
							resolve(all)
						}
						j += 1
					})


				}
			}
		})
	})
}


exports.allVotes = allVotes




// allVotes()
// changeVote("123456", "Trump")
// inspection()
// followYourVote("123459")
// totalVotes()
// addVote("123460", "Obama")
// countVoteForCandidate("Obama")

// db.candidates.insert({name:"Obama",userid:"000000",time:"1514624129871",nonce:"0",hash:"0000000000000000000000000000000000000000000000000000000000000000"})

var sha256 = function sha256(ascii) {
	function rightRotate(value, amount) {
		return (value >>> amount) | (value << (32 - amount));
	};

	var mathPow = Math.pow;
	var maxWord = mathPow(2, 32);
	var lengthProperty = 'length'
	var i, j; // Used as a counter across the whole file
	var result = ''

	var words = [];
	var asciiBitLength = ascii[lengthProperty] * 8;

	//* caching results is optional - remove/add slash from front of this line to toggle
	// Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
	// (we actually calculate the first 64, but extra values are just ignored)
	var hash = sha256.h = sha256.h || [];
	// Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
	var k = sha256.k = sha256.k || [];
	var primeCounter = k[lengthProperty];
	/*/
	var hash = [], k = [];
	var primeCounter = 0;
	//*/

	var isComposite = {};
	for (var candidate = 2; primeCounter < 64; candidate++) {
		if (!isComposite[candidate]) {
			for (i = 0; i < 313; i += candidate) {
				isComposite[i] = candidate;
			}
			hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
			k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
		}
	}

	ascii += '\x80' // Append Ƈ' bit (plus zero padding)
	while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
	for (i = 0; i < ascii[lengthProperty]; i++) {
		j = ascii.charCodeAt(i);
		if (j >> 8) return; // ASCII check: only accept characters in range 0-255
		words[i >> 2] |= j << ((3 - i) % 4) * 8;
	}
	words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
	words[words[lengthProperty]] = (asciiBitLength)

	// process each chunk
	for (j = 0; j < words[lengthProperty];) {
		var w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
		var oldHash = hash;
		// This is now the undefinedworking hash", often labelled as variables a...g
		// (we have to truncate as well, otherwise extra entries at the end accumulate
		hash = hash.slice(0, 8);

		for (i = 0; i < 64; i++) {
			var i2 = i + j;
			// Expand the message into 64 words
			// Used below if 
			var w15 = w[i - 15], w2 = w[i - 2];

			// Iterate
			var a = hash[0], e = hash[4];
			var temp1 = hash[7]
				+ (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) // S1
				+ ((e & hash[5]) ^ ((~e) & hash[6])) // ch
				+ k[i]
				// Expand the message schedule if needed
				+ (w[i] = (i < 16) ? w[i] : (
					w[i - 16]
					+ (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) // s0
					+ w[i - 7]
					+ (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
				) | 0
				);
			// This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
			var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) // S0
				+ ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

			hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
			hash[4] = (hash[4] + temp1) | 0;
		}

		for (i = 0; i < 8; i++) {
			hash[i] = (hash[i] + oldHash[i]) | 0;
		}
	}

	for (i = 0; i < 8; i++) {
		for (j = 3; j + 1; j--) {
			var b = (hash[i] >> (j * 8)) & 255;
			result += ((b < 16) ? 0 : '') + b.toString(16);
		}
	}
	return result;
};


// console.log(CalculateHash("123456","1514621557552","Trump", "0000000000000000000000000000000000000000000000000000000000000000"))