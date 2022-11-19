function check(guess, answer) {
    const letters = answer.split('').map((letter, index) => ({ letter, index }));

    let feedback = 0;

    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === answer[i]) {
            feedback += 2 * (3 ** (guess.length - 1 - i));
            letters.splice(letters.findIndex(({ index }) => i === index), 1);
        }
    }

    for (let i = 0; i < guess.length; i++) {
        if (guess[i] !== answer[i]) {
            const letterIndex = letters.findIndex(({ letter }) => letter === guess[i]);
            if (letterIndex !== -1) {
                feedback += 3 ** (guess.length - 1 - i);
                letters.splice(letterIndex, 1);
            }
        }
    }

    return feedback;
}

function getAllPossibilities(guess) {
	const words = {};

	for (let answer of dictionary) {
		const feedback = check(guess, answer);
		words[feedback] = words[feedback] || [];
		words[feedback].push(answer);
	}

	return words;
}

function getNextWord(guess, feedback) {
    dictionary = getAllPossibilities(guess)[feedback];

    let nextWord = '';
    let nextWordEntropy = 0;

    for (let word of dictionary) {
        const possibilities = Object.values(getAllPossibilities(word));
        const entropy = possibilities.reduce((acc, words) => acc + (words.length / dictionary.length) * (Math.log2(dictionary.length / words.length)), 0);

        if (entropy > nextWordEntropy) {
            nextWord = word;
            nextWordEntropy = entropy;
        }
    }

    return nextWord;
}