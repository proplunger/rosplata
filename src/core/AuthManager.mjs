import { parseJwt } from "../utils/utils.mjs"
import { FeatureDetector } from "./FeatureDetector.mjs"

class CAuthManager {
    #isLoggedIn = false
    #data

    get isLoggedIn() {
        return this.#isLoggedIn
    }

    get data() {
        return this.#data
    }

    onLogin() {
        throw new Error('onLogin is not implemented')
    }
    
    onLogout() {
        throw new Error('onLogout is not implemented')
    }

    start = async () => {
        if (FeatureDetector.federatedLogin) {
            const profile = await navigator.credentials.get({
                federated: {
                    providers: [
                        'https://accounts.google.com',
                    ],
                },
                mediation: 'silent'
            });
            if (profile && await this.#verify(profile)) {
                this.#isLoggedIn = true
                this.#data = profile
                this.onLogin()
                return
            }
        }
        google.accounts.id.initialize({
            client_id: '1094687239432-p5670t7mfte768qtssg70koaf11vgp34.apps.googleusercontent.com',
            callback: this.#handleCredentialResponse,
            itp_support: false,
        })
        this.#initLoginBtn()
    }

    #initLoginBtn() {
        google.accounts.id.prompt(this.#handleGoogleUI)
    }

    async #verify(profile) {
        return true 
    }

    logout = async () => {
        this.onLogout()
        this.#isLoggedIn = false
        this.#data = null
        await navigator.credentials.preventSilentAccess()
        this.#initLoginBtn()
    }

    #handleGoogleUI = (notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Google auth UI is not displayed because ', notification.getNotDisplayedReason())
            this.#renderLoginButton()
        }
        if (notification.isDismissedMoment()) {
            console.log('Google auth UI is dismissed because', notification.getDismissedReason())
            this.#renderLoginButton()
        }
    }

    async #storeCredentials(profile) {
        const c = await navigator.credentials.create({
            federated: {
                id: profile.email,
                provider: 'https://accounts.google.com',
                name: profile.name,
                iconURL: profile.picture,
                protocol: 'openidconnect',
            },
        });
        console.log({ c });
        return navigator.credentials.store(c);
    }

    #handleCredentialResponse = async (evt) => {
        this.#isLoggedIn = true
        if (FeatureDetector.federatedLogin) {
            await this.#storeCredentials(parseJwt(evt.credential))
        }
        this.onLogin()
    }

    #renderLoginButton() {
        const loginBtn = document.querySelector('#login__google')
        google.accounts.id.renderButton(
            loginBtn,
            {
                type: 'button',
                theme: 'filled_white',
                shape: 'circular',
                text: 'Login with Google',
            }
        )
    }
}

export const AuthManager = new CAuthManager()
