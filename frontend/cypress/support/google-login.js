// Actual Google OAuth UI. No tokens/callbacks are mocked.
export function loginGoogle(account, googlePassword) {
  cy.contains('button', 'Masuk dengan Google').click();
  cy.origin('https://accounts.google.com', {
    args: { email: account, password: googlePassword },
  }, ({ email, password }) => {
    const emailSelector = '#identifierId, input[name="identifier"], input[type="email"]';
    const passwordSelector = 'input[name="Passwd"], input[type="password"]';
    const isRendered = element => element.getClientRects().length > 0;
    cy.get('body', { timeout: 30000 }).should($body => {
      if (/browser or app may not be secure|browser atau aplikasi ini mungkin tidak aman/i.test($body.text())) {
        throw new Error('BLOCKED: Google menolak browser otomatis.');
      }
      const controls = $body.find(`${emailSelector}, ${passwordSelector}, [data-identifier]`)
        .filter((_, element) => isRendered(element));
      const fields = [...$body.find('input')].map(element => ({
        id: element.id, name: element.name, type: element.type,
      }));
      expect(controls.length, `Kontrol login Google ditemukan; input metadata: ${JSON.stringify(fields)}`)
        .to.be.greaterThan(0);
    }).then($body => {
      const chooser = $body.find('[data-identifier]').filter((_, element) =>
        isRendered(element) && element.getAttribute('data-identifier')?.toLowerCase() === email.toLowerCase());
      if (chooser.length) {
        cy.wrap(chooser.first()).should('be.visible').click();
        return;
      }
      const emailField = $body.find(emailSelector).filter((_, element) => isRendered(element));
      if (emailField.length) {
        cy.wrap(emailField.first(), { log: false }).should('be.visible').and('be.enabled')
          .clear().type(email, { log: false });
        cy.get('#identifierNext').should('be.visible').click();
      }
      cy.get('body', { timeout: 30000 }).should($page => {
        if (/browser or app may not be secure|browser atau aplikasi ini mungkin tidak aman/i.test($page.text())) {
          throw new Error('BLOCKED: Google menolak browser otomatis setelah email dimasukkan. Autentikasi Google belum dapat diuji; bukan bukti bug pemulihan NOLLA.');
        }
        expect($page.find(passwordSelector).filter((_, element) => isRendered(element)).length,
          'Kolom password Google tampil').to.eq(1);
      });
      cy.get(passwordSelector).filter((_, element) => isRendered(element))
        .should('be.visible').type(password, { log: false });
      cy.get('#passwordNext').should('be.visible').click();
    });
    cy.wrap(null, { log: false });
  });
}
