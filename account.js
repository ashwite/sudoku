(() => {
  const key = document.currentScript.dataset.publishableKey;
  if (!key) return;

  const panel = document.querySelector('#account');
  const status = document.querySelector('#account-status');
  const footerStatus = document.querySelector('#footer-account-status');
  function showStatus(text) {
    status.textContent = text;
    footerStatus.textContent = text;
  }

  const signIn = document.querySelector('#account-sign-in');
  const footerSignIn = document.querySelector('#footer-sign-in');
  const footerSave = document.querySelector('#footer-save');
  const footerLoad = document.querySelector('#footer-load');
  const signUp = document.querySelector('#account-sign-up');
  const saveActions = document.querySelector('#account-save-actions');
  const save = document.querySelector('#account-save');
  const load = document.querySelector('#account-load');
  const signOut = document.querySelector('#account-sign-out');
  const controls = [signIn, signUp, save, load, signOut, footerSignIn, footerSave, footerLoad];
  const message = (de, en) => document.documentElement.lang === 'en' ? en : de;

  function loadScript(url, publishableKey) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      if (publishableKey) script.dataset.clerkPublishableKey = publishableKey;
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
  }

  async function initialize() {
    const encoded = key.match(/^pk_(?:test|live)_([A-Za-z0-9+/=]+)$/)?.[1];
    const domain = encoded && atob(encoded).match(/^([a-z0-9.-]+)\$$/i)?.[1];
    if (!domain) throw new Error('Invalid Clerk publishable key');
    await loadScript(`https://${domain}/npm/@clerk/ui@1/dist/ui.browser.js`);
    await loadScript(`https://${domain}/npm/@clerk/clerk-js@6/dist/clerk.browser.js`, key);
    const clerk = window.Clerk;
    await clerk.load({ ui: { ClerkUI: window.__internal_ClerkUICtor } });

    function render() {
      const signedIn = Boolean(clerk.user);
      signIn.hidden = signUp.hidden = signedIn;
      footerSignIn.hidden = footerSave.hidden = footerLoad.hidden = false;
      footerSignIn.dataset.text = signedIn ? 'accountSignOut' : 'accountSignIn';
      footerSignIn.textContent = translate(footerSignIn.dataset.text);
      signOut.hidden = !signedIn;
    }

    function run(action) {
      return async () => {
        controls.forEach(button => { button.disabled = true; });
        showStatus('');
        try {
          if (!clerk.user) {
            clerk.openSignIn();
            return;
          }
          await action();
        } catch {
          showStatus(message('Vorgang fehlgeschlagen. Bitte erneut versuchen.', 'Action failed. Please try again.'));
        } finally {
          controls.forEach(button => { button.disabled = false; });
          render();
        }
      };
    }

    signIn.onclick = () => clerk.openSignIn();
    signUp.onclick = () => clerk.openSignUp();
    const endSession = run(() => clerk.signOut());
    signOut.onclick = endSession;
    footerSignIn.onclick = endSession;
    save.onclick = footerSave.onclick = run(async () => {
      const user = clerk.user;
      const snapshot = JSON.stringify(game);
      await user.reload();
      if (clerk.user?.id !== user.id) return;
      if (user.unsafeMetadata.sudokuSave && !confirm(message(
        'Den bisherigen Online-Spielstand ersetzen?', 'Replace the previous online save?'
      ))) return;
      await user.updateMetadata({ unsafeMetadata: { sudokuSave: snapshot } });
      showStatus(message('Online gespeichert.', 'Saved online.'));
    });
    load.onclick = footerLoad.onclick = run(async () => {
      const user = clerk.user;
      await user.reload();
      if (clerk.user?.id !== user.id) return;
      const snapshot = user.unsafeMetadata.sudokuSave;
      if (typeof snapshot !== 'string') {
        showStatus(message('Kein Online-Spielstand vorhanden.', 'No online save found.'));
        return;
      }
      if (!confirm(message('Den aktuellen Spielstand ersetzen?', 'Replace the current game?'))) return;
      if (!loadGame(snapshot)) throw new Error('Invalid Sudoku save');
      selectedCell = -1;
      saveGame();
      renderBoard();
      if (game.done) advanceAfterCompletion();
      showStatus(message('Online-Spielstand geladen.', 'Online save loaded.'));
    });
    clerk.addListener(render);
    render();
    panel.hidden = false;
  }

  initialize().catch(() => {
    saveActions.hidden = true;
    controls.forEach(button => { button.hidden = true; });
    showStatus(message('Anmeldung derzeit nicht verfügbar.', 'Sign-in is currently unavailable.'));
    panel.hidden = false;
  });
})();
