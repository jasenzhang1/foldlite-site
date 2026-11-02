# Waitlist website

A single-page site for the lamp drops: product teaser, how it works, market
dates, FAQ, and a **waitlist sign-up** (email, plus optional name, ZIP and
product interests). No build step: plain HTML/CSS/JS.

| File | Purpose |
|---|---|
| `index.html` | The site. Brand name, copy, market list and form config all live here |
| `thanks.html` | Fallback confirmation page if JavaScript is off |

## Preview locally

```bash
cd website && python3 -m http.server 8000   # open http://localhost:8000
```

The form will show an error locally because there's no backend; that's expected.

## Deploy (pick one)

**Option A: Netlify (recommended, zero config).**
Drag the `website/` folder onto <https://app.netlify.com/drop>, or connect the
GitHub repo with *Base directory* = `website`. Netlify detects the
`data-netlify="true"` form automatically. Sign-ups appear under
**Site → Forms → waitlist** and export to CSV. The free tier allows
100 submissions/month; turn on email notifications in Forms settings.

**Option B: Any static host (GitHub Pages, Cloudflare Pages, Vercel).**
Create a free form endpoint (e.g. [Formspree](https://formspree.io)) and paste
its URL into `WAITLIST_ENDPOINT` near the bottom of `index.html`.

When the list grows, export the CSV into an email tool (Mailchimp, Kit,
Buttondown) to send drop announcements.

## Before launch — TODO

- [ ] **Brand name.** "Foldlight" is a placeholder (README says the name is TBD).
      Search/replace it, and check trademark + domain/handle availability.
- [ ] Contact email and Instagram/TikTok links in the footer.
- [ ] Prices once the product lineup is set.
- [ ] Real product photos (swap in for the animated icosahedron or add a gallery).
- [ ] Update the "Find us at LA markets" list as bookings are confirmed
      (see [`../ideation/markets.md`](../ideation/markets.md)).
- [ ] A one-line privacy note / unsubscribe link once emails start going out.
