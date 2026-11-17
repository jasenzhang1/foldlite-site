# Storefront website

The customer-facing site: browse the lamp kit, read the details, and reserve or
buy. Plain HTML, CSS and JS with no build step. The lamp pictures are drawn in
code (`assets/site.js`) until real photos exist.

| File | Purpose |
|---|---|
| `index.html` | Landing page: hero with a turning lamp you can control with the 7 speed buttons, the kit, how it works, the base, the shade line, fairs, FAQ, sign-up |
| `shop.html` | Product listing with filters (lamp kits / shade kits) |
| `product.html` | The Icosahedron Lamp Kit: gallery, buy/reserve box, what's in the box, details, safety, origami credit |
| `thanks.html` | After sign-up, or after a Stripe order (`thanks.html?order=1`) |
| `assets/site.css` | All styles (light and dark) |
| `assets/site.js` | **Shop settings at the top**, forms, buy buttons and the lamp drawings |

## Live site

Hosted on GitHub Pages from a separate **public** repo, so this private repo
stays private: <https://jasenzhang1.github.io/foldlight-site/>

To publish changes, from the root of this repo:

```bash
git subtree split --prefix website -b site-deploy
git push https://github.com/jasenzhang1/foldlight-site.git site-deploy:main --force
git branch -D site-deploy
```

Pages updates about a minute after the push.

## Turning on sales: the 4 settings in `assets/site.js`

| Setting | What it does | How to get it |
|---|---|---|
| `price` | Shows the price everywhere, e.g. `129` | Your decision (PRD target $100–150) |
| `checkoutUrl` | "Reserve" buttons become "Buy" and go to Stripe checkout | Stripe dashboard > Payment Links > new link for the kit. Turn on address collection and quantity. Set *After payment* to redirect to `https://jasenzhang1.github.io/foldlight-site/thanks.html?order=1` |
| `waitlistEndpoint` | Makes the sign-up and reserve forms work. **GitHub Pages can't receive forms**, so until this is set, the forms show "sign-up isn't open yet" | Free Formspree form (formspree.io), paste its URL |
| `contactEmail` | Footer email and a fallback "email us to reserve" link | A business address, not a personal one |

**Before setting `checkoutUrl`**, see [../docs/LEGAL.md](../docs/LEGAL.md) §A3–A4:
safety tests T1–T4 must pass before any kit is sold, and online sales trigger
the designer-credit and compliance reviews.

## Preview locally

Open `index.html` in a browser, or run `python -m http.server 8000` in this
folder and go to <http://localhost:8000>.

## Before launch: TODO

- [ ] **Brand name.** "Foldlight" is a placeholder. Search and replace it, and check the trademark and domain.
- [ ] Real photos of a folded, lit lamp, to replace or sit beside the drawings.
- [ ] The four settings above.
- [ ] Fair dates in the "See one lit" list on `index.html`.
- [ ] A privacy note and unsubscribe link once emails go out.
- [ ] Guarantee wording on the product page, once LEGAL.md §A1 is checked.
