function copyToClipboard(value) {
	const hiddenElement = document.createElement('input');
	hiddenElement.style.background = 'transparent';
	hiddenElement.value = value;

	document.body.appendChild(hiddenElement);
	hiddenElement.select();
	document.execCommand('copy');
	document.body.removeChild(hiddenElement);
}

const siteField = document.querySelector('#site');
const passwordField = document.querySelector('#password');
const numberCharsField = document.querySelector('#numberChars');
const specialCharsField = document.querySelector('#specialChars');
const generatedPasswordField = document.querySelector('#generatedPassword');
const copyButton = document.querySelector('#copy');
const eyes = document.querySelectorAll('.eye');

const updateProgressFn = e => console.log(e);

document.addEventListener('input', () => {
	algorithms['SHA-512'](
		siteField.value + passwordField.value,
		parseInt(numberCharsField.value),
		specialCharsField.checked,
		updateProgressFn
	).then(password => generatedPasswordField.value = password);
});

copyButton.addEventListener('click', () => copyToClipboard(generatedPasswordField.value));

Array.from(eyes).forEach(eye => {
	eye.addEventListener('click', () => {
		const input = eye.parentElement.querySelector('input');
		input.type = eye.classList.contains('crossed') ? 'password' : 'text';
		eye.classList.toggle('crossed');
	});
});

function Algorithm(algorithmCallback) {
	return function(text, size, specialChars, progressCallback) {
		return algorithmCallback(text, size, specialChars, progressCallback);
	}
}

const sha512 = function() {
	const charSet64 = [
		'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
		'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
		'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '_'
	];

	const charSet128 = [
		'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
		'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
		'À', 'Â', 'Ä', 'Æ', 'Ç', 'É', 'È', 'Ê', 'Ë', 'Î', 'Ï', 'Ô', 'Œ', 'Ù', 'Û', 'Ü', 'à', 'â', 'ä', 'æ', 'ç',
		'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'œ', 'ù', 'û', 'ü', ' ', '!', '"', '#', '$', '%', '&', '\'', '(', ')',
		'*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}',
		'~', '£', '€', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
	];

	return function(text, size, specialChars) {
		const chars = specialChars ? charSet128 : charSet64;
		const divider = specialChars ? 2 : 4;

		return crypto.subtle.digest('SHA-512', new TextEncoder().encode(text)).then(buffer => {
			return Array.from(new Uint8Array(buffer)).map(value => chars[Math.floor(value / divider)]).join('').substring(0, size);
		});
	}

}();

const algorithms = {
	'SHA-512': Algorithm(sha512)
};