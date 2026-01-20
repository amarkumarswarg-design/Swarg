// AES-256 Encryption/Decryption Utility
class AES256Encryptor {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    // Generate a cryptographic key from password
    async generateKeyFromPassword(password, salt) {
        const passwordBuffer = this.encoder.encode(password);
        const importedKey = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            importedKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Real AES-256-GCM Encryption
    async encrypt(text, password) {
        try {
            // Validate inputs
            if (!text || !password) {
                throw new Error('Text and password are required');
            }

            // Generate random salt (16 bytes)
            const salt = crypto.getRandomValues(new Uint8Array(16));
            
            // Generate random IV (12 bytes for AES-GCM)
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Derive key from password
            const key = await this.generateKeyFromPassword(password, salt);
            
            // Encrypt the text
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                this.encoder.encode(text)
            );

            // Convert everything to base64 for storage
            const encryptedArray = new Uint8Array(encryptedBuffer);
            const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
            
            combined.set(salt);
            combined.set(iv, salt.length);
            combined.set(encryptedArray, salt.length + iv.length);

            // Return base64 encoded string
            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    // Real AES-256-GCM Decryption
    async decrypt(encryptedBase64, password) {
        try {
            // Validate inputs
            if (!encryptedBase64 || !password) {
                throw new Error('Encrypted text and password are required');
            }

            // Decode base64
            const binaryString = atob(encryptedBase64);
            const combined = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                combined[i] = binaryString.charCodeAt(i);
            }

            // Extract salt, IV, and encrypted data
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const encryptedData = combined.slice(28);

            // Derive key from password
            const key = await this.generateKeyFromPassword(password, salt);
            
            // Decrypt the data
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encryptedData
            );

            // Return decrypted text
            return this.decoder.decode(decryptedBuffer);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Decryption failed. Invalid password or corrupted data.');
        }
    }
}

// Main Application
class SwargEncryptionApp {
    constructor() {
        this.encryptor = new AES256Encryptor();
        this.currentExpiryTimer = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTypingSound();
        this.registerServiceWorker();
        this.checkPWAInstall();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchTab(tabId);
                this.playSound('type');
            });
        });

        // Password visibility toggle
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.target;
                this.togglePasswordVisibility(targetId);
            });
        });

        // Encrypt button
        document.getElementById('encryptBtn').addEventListener('click', () => {
            this.handleEncryption();
        });

        // Decrypt button
        document.getElementById('decryptBtn').addEventListener('click', () => {
            this.handleDecryption();
        });

        // Clear buttons
        document.getElementById('clearEncryptBtn').addEventListener('click', () => {
            this.clearEncryptForm();
            this.playSound('type');
        });

        document.getElementById('clearDecryptBtn').addEventListener('click', () => {
            this.clearDecryptForm();
            this.playSound('type');
        });

        // Copy buttons
        document.getElementById('copyEncryptBtn').addEventListener('click', () => {
            this.copyToClipboard('encryptedOutput');
        });

        document.getElementById('copyDecryptBtn').addEventListener('click', () => {
            this.copyToClipboard('decryptedOutput');
        });

        // Textarea typing sounds
        ['encryptText', 'decryptText'].forEach(id => {
            const textarea = document.getElementById(id);
            if (textarea) {
                textarea.addEventListener('input', () => {
                    if (Math.random() > 0.7) { // Randomize to not be annoying
                        this.playSound('type');
                    }
                });
            }
        });
    }

    setupTypingSound() {
        // Preload sounds
        this.sounds = {
            type: document.getElementById('typeSound'),
            encrypt: document.getElementById('encryptSound'),
            decrypt: document.getElementById('decryptSound')
        };
    }

    playSound(type) {
        const sound = this.sounds[type];
        if (!sound) return;

        // Handle browser autoplay restrictions
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Silent fail - user might have blocked audio
                console.log('Audio play blocked');
            });
        }
    }

    async switchTab(tabId) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabId}-tab`).classList.add('active');
    }

    togglePasswordVisibility(targetId) {
        const input = document.getElementById(targetId);
        const button = document.querySelector(`.toggle-password[data-target="${targetId}"]`);
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    async handleEncryption() {
        const text = document.getElementById('encryptText').value.trim();
        const password = document.getElementById('encryptPassword').value.trim();

        // Validation
        if (!text) {
            this.showToast('Please enter text to encrypt', 'error');
            return;
        }

        if (!password) {
            this.showToast('Password is required for AES-256 encryption', 'error');
            return;
        }

        if (password.length < 8) {
            this.showToast('Password should be at least 8 characters long', 'error');
            return;
        }

        // Show loading animation
        this.showLoading();

        try {
            // Real AES-256 Encryption
            const encrypted = await this.encryptor.encrypt(text, password);
            
            // Display result
            document.getElementById('encryptedOutput').textContent = encrypted;
            document.getElementById('encryptResult').classList.add('show');
            
            // Auto copy to clipboard
            await this.copyToClipboard('encryptedOutput');
            
            // Play success sound
            this.playSound('encrypt');
            
            // Show success message
            this.showToast('Text encrypted successfully! Copied to clipboard.', 'success');
            
            // Start expiry timer
            this.startExpiryTimer();
            
        } catch (error) {
            console.error('Encryption failed:', error);
            this.showToast(error.message || 'Encryption failed', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleDecryption() {
        const encryptedText = document.getElementById('decryptText').value.trim();
        const password = document.getElementById('decryptPassword').value.trim();

        // Validation
        if (!encryptedText) {
            this.showToast('Please enter encrypted text', 'error');
            return;
        }

        if (!password) {
            this.showToast('Password is required for decryption', 'error');
            return;
        }

        // Show loading animation
        this.showLoading();

        try {
            // Real AES-256 Decryption
            const decrypted = await this.encryptor.decrypt(encryptedText, password);
            
            // Display result
            document.getElementById('decryptedOutput').textContent = decrypted;
            document.getElementById('decryptResult').classList.add('show');
            
            // Auto copy to clipboard
            await this.copyToClipboard('decryptedOutput');
            
            // Play success sound
            this.playSound('decrypt');
            
            // Show success message
            this.showToast('Text decrypted successfully! Copied to clipboard.', 'success');
            
        } catch (error) {
            console.error('Decryption failed:', error);
            this.showToast(error.message || 'Decryption failed. Invalid password or corrupted data.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    clearEncryptForm() {
        document.getElementById('encryptText').value = '';
        document.getElementById('encryptPassword').value = '';
        document.getElementById('encryptResult').classList.remove('show');
        this.stopExpiryTimer();
    }

    clearDecryptForm() {
        document.getElementById('decryptText').value = '';
        document.getElementById('decryptPassword').value = '';
        document.getElementById('decryptResult').classList.remove('show');
    }

    async copyToClipboard(elementId) {
        const text = document.getElementById(elementId).textContent;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Copied to clipboard!', 'success');
        }
    }

    startExpiryTimer() {
        this.stopExpiryTimer(); // Clear any existing timer
        
        let timeLeft = 30 * 60; // 30 minutes in seconds
        const timerElement = document.getElementById('expiryTimer');
        
        this.currentExpiryTimer = setInterval(() => {
            if (timeLeft <= 0) {
                this.stopExpiryTimer();
                timerElement.textContent = '00:00';
                this.showToast('Encrypted data has expired', 'warning');
                document.getElementById('encryptResult').classList.remove('show');
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            timeLeft--;
        }, 1000);
    }

    stopExpiryTimer() {
        if (this.currentExpiryTimer) {
            clearInterval(this.currentExpiryTimer);
            this.currentExpiryTimer = null;
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');
        
        // Set message and icon
        toastMessage.textContent = message;
        
        // Update icon based on type
        if (type === 'success') {
            toastIcon.className = 'fas fa-check-circle';
            toast.classList.remove('error');
            toast.classList.add('success');
        } else if (type === 'error') {
            toastIcon.className = 'fas fa-exclamation-circle';
            toast.classList.remove('success');
            toast.classList.add('error');
        } else if (type === 'warning') {
            toastIcon.className = 'fas fa-exclamation-triangle';
            toast.classList.remove('success', 'error');
        }
        
        // Show toast
        toast.classList.add('show');
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    checkPWAInstall() {
        // Check if app is installed
        window.addEventListener('appinstalled', () => {
            this.showToast('SWARG installed successfully!', 'success');
        });
        
        // Show install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button after 5 seconds
            setTimeout(() => {
                this.showInstallPrompt(deferredPrompt);
            }, 5000);
        });
    }

    showInstallPrompt(deferredPrompt) {
        const shouldShow = Math.random() > 0.5; // Show to 50% of users
        if (!shouldShow) return;
        
        this.showToast('Install SWARG for offline access?', 'success');
        
        // Add install button to toast
        const toast = document.getElementById('toast');
        const installBtn = document.createElement('button');
        installBtn.textContent = 'Install';
        installBtn.style.marginLeft = '10px';
        installBtn.style.padding = '5px 10px';
        installBtn.style.background = 'var(--primary)';
        installBtn.style.border = 'none';
        installBtn.style.borderRadius = '5px';
        installBtn.style.color = 'white';
        installBtn.style.cursor = 'pointer';
        
        installBtn.addEventListener('click', async () => {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                this.showToast('Installing SWARG...', 'success');
            }
            deferredPrompt = null;
        });
        
        toast.appendChild(installBtn);
        
        // Remove install button after toast disappears
        setTimeout(() => {
            if (installBtn.parentNode === toast) {
                toast.removeChild(installBtn);
            }
        }, 4000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SwargEncryptionApp();
});

// PWA Installation
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
              }
