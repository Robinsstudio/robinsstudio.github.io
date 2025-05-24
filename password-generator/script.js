const siteField = document.querySelector('#site');
const passwordField = document.querySelector('#password');
const numberCharsField = document.querySelector('#numberChars');
const generatedPasswordField = document.querySelector('#generatedPassword');
const copyButton = document.querySelector('#copy');
const eyes = Array.from(document.querySelectorAll('.eye'));
const progressBarText = document.querySelector('.progress-bar-text');
const progressBarOverlay = document.querySelector('.progress-bar-overlay');

const SITE = 'SITE';
const NUMBER_CHARS = 'NUMBER_CHARS';

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

			setLocalStorage(SITE, siteField.value);
			setLocalStorage(NUMBER_CHARS, numberCharsField.value);
			eyes.forEach(eye => togglePasswordVisibility(eye, { visible: false }));

			algorithms['bcrypt'].run(
				siteField.value + passwordField.value,
				updateProgress
			).then(password => {
				updatePassword(password);
				updateMessage('Mot de passe généré');

				computing = false;
			});
		}
	}
})();

function togglePasswordVisibility(eye, visibility) {
	const crossed = eye.classList.contains('crossed');
	const visible = visibility ? visibility.visible : !crossed;

	if (visible !== crossed) {
		const input = eye.parentElement.querySelector('input');
		input.type = crossed ? 'password' : 'text';
		eye.classList.toggle('crossed');
	}
}

function updatePassword(pass) {
	password = pass;
	updateSize();
}

function updateSize() {
	const size = parseInt(numberCharsField.value);
	generatedPasswordField.value = password.slice(0, size);
}

function getLocalStorage(itemName, defaultValue) {
	return window.localStorage.getItem(itemName) || defaultValue;
}

function setLocalStorage(itemName, value) {
	return window.localStorage.setItem(itemName, value);
}

siteField.value = getLocalStorage(SITE, '');
numberCharsField.value = parseInt(getLocalStorage(NUMBER_CHARS, '30'));

document.addEventListener('keydown', event => {
	if (event.key === 'Enter') {
		generatePassword();
	}
});

numberCharsField.addEventListener('input', () => updateSize());

copyButton.addEventListener('click', () => copyToClipboard(generatedPasswordField.value));

eyes.forEach(eye => eye.addEventListener('click', () => togglePasswordVisibility(eye)));

const bcrypt = function() {
	const DUMMY_SALT = 'RobinRobinRobinRobinRe';
	const prefix = `$2a$15$${DUMMY_SALT}`;

	return function(text, progressCallback) {
		return new Promise(resolve => {
			const resolvePromise = (error, hash) => resolve({ error, hash });
			window.bcrypt.hash(text, prefix, resolvePromise, progressCallback)
		}).then(({ hash }) => hash.slice(prefix.length));
	};
};

const algorithms = {
	'bcrypt': {
		run: bcrypt()
	}
};
