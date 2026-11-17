import { LogoMark } from '../../shared/Icon'
import { BareLayout } from '../Layout'
import { FlashMessage, type Flash } from '../ui'

export function LoginPage({ email, next, totp, flash }: { email?: string; next?: string; totp: boolean; flash?: Flash | null }) {
  return (
    <BareLayout title="Connexion">
      <main class="auth">
        <div class="auth-card">
          <div class="card-head">
            <h2>
              <LogoMark size={24} />
              luuxis · admin
            </h2>
          </div>
          <div class="card-body">
            <h1>Connexion</h1>
            <FlashMessage flash={flash} />
            <form method="post" action="/admin/connexion" class="form">
              <input type="hidden" name="next" value={next ?? ''} />
              <label class="field">
                <span>Identifiant</span>
                <input class="input" type="email" name="email" value={email ?? ''} autocomplete="username" required autofocus={!email} />
              </label>
              <label class="field">
                <span>Mot de passe</span>
                <input class="input" type="password" name="password" autocomplete="current-password" required autofocus={Boolean(email)} />
              </label>
              {totp ? (
                <label class="field">
                  <span>Code de l'application</span>
                  <input
                    class="input mono"
                    type="text"
                    name="code"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    pattern="[0-9 ]{6,7}"
                    maxlength={7}
                    placeholder="123 456"
                    required
                  />
                </label>
              ) : null}
              <button type="submit" class="btn btn-primary btn-block">
                Se connecter
              </button>
            </form>
          </div>
        </div>
      </main>
    </BareLayout>
  )
}
