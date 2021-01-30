const siteField = document.querySelector('#site');
const passwordField = document.querySelector('#password');
const numberCharsField = document.querySelector('#numberChars');
const specialCharsField = document.querySelector('#specialChars');
const algorithmField = document.querySelector('#algorithm input');
const algorithmValue = document.querySelector('#algorithm .value');
const generatedPasswordField = document.querySelector('#generatedPassword');
const copyButton = document.querySelector('#copy');
const eyes = document.querySelectorAll('.eye');
const progressBarText = document.querySelector('.progress-bar-text');
const progressBarOverlay = document.querySelector('.progress-bar-overlay');

let password = '';

function updateProgress(progress) {
	const percentage = progress * 100;

	progressBarText.textContent = `Génération du mot de passe... (${Math.round(percentage)} %)`;
	progressBarOverlay.style.width = `${percentage}%`;
}

function updateMessage(message) {
	progressBarText.textContent = message;
}

function copyToClipboard(value) {
	const fakeElement = document.createElement('input');
	fakeElement.value = value;

	document.body.appendChild(fakeElement);
	fakeElement.select();
	document.execCommand('copy');
	document.body.removeChild(fakeElement);

	updateMessage('Mot de passe copié');
}

const generatePassword = (function() {
	let computing = false;

	return function() {
		if (!computing) {
			computing = true;

			algorithms[algorithmField.value].run(
				siteField.value + passwordField.value,
				specialCharsField.checked,
				updateProgress
			).then(password => {
				updatePassword(password);
				updateMessage('Mot de passe généré');

				computing = false;
			});
		}
	}
})();

function updatePassword(pass) {
	password = pass;
	updateSize();
}

function updateSize() {
	const size = parseInt(numberCharsField.value);
	generatedPasswordField.value = password.slice(0, size);
}

document.addEventListener('keydown', event => {
	if (event.key === 'Enter') {
		generatePassword();
	}
});

algorithmField.addEventListener('input', event => {
	const { value } = event.target;
	if (value) {
		algorithmValue.textContent = algorithms[value].name;
	}
});

numberCharsField.addEventListener('input', () => updateSize());

copyButton.addEventListener('click', () => copyToClipboard(generatedPasswordField.value));

Array.from(eyes).forEach(eye => {
	eye.addEventListener('click', () => {
		const input = eye.parentElement.querySelector('input');
		input.type = eye.classList.contains('crossed') ? 'password' : 'text';
		eye.classList.toggle('crossed');
	});
});

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

	return function(text, specialChars) {
		const chars = specialChars ? charSet128 : charSet64;
		const divider = specialChars ? 2 : 4;

		return window.crypto.subtle.digest('SHA-512', new TextEncoder().encode(text)).then(buffer => {
			return Array.from(new Uint8Array(buffer)).map(value => chars[Math.floor(value / divider)]).join('');
		});
	}

};

const bcrypt = function() {
	const DUMMY_SALT = 'RobinRobinRobinRobinRe';
	const prefix = `$2a$15$${DUMMY_SALT}`;

	return function(text, _, progressCallback) {
		return new Promise(resolve => {
			const resolvePromise = (error, hash) => resolve({ error, hash });
			window.dcodeIO.bcrypt.hash(text, prefix, resolvePromise, progressCallback)
		}).then(({ hash }) => hash.slice(prefix.length));
	};
};

const algorithms = [{
	name: 'SHA-512',
	run: sha512()
}, {
	name: 'bcrypt',
	run: bcrypt()
}];