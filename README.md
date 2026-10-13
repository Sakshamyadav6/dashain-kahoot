# Dashain Tihar Quiz

A live quiz for a Dashain and Tihar event. One laptop on the projector is the host. Everyone else joins from a phone by scanning a QR code or typing a PIN, then taps a colored shape. The question stays on the big screen.

Scoring matches Kahoot: a correct answer is worth about 1000 points if it is instant, and about 500 if it lands as the timer ends. Wrong or missing answers score 0. The server clock decides the points, so a phone cannot claim a faster time.

## Questions

Put your quiz in a JSON file and upload it on the host screen. `correct` is the choice position, starting at 0. Each question needs 2 to 4 choices. `seconds` is optional and defaults to 20 (allowed range 5 to 120).

```json
{
  "title": "Dashain Tihar Quiz",
  "questions": [
    {
      "prompt": "Your question, English or Nepali",
      "choices": ["A", "B", "C", "D"],
      "correct": 0,
      "seconds": 20
    }
  ]
}
```

[`data/questions.example.json`](data/questions.example.json) is only a format sample. The host screen can also load it so you can rehearse the buttons.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Upgrade it to **Pro** before the event. The free plan allows 200 realtime connections and 100 realtime messages per second. One “question started” push to 150 phones is about 150 deliveries, so the free cap can drop that ping and make scoring unfair. Pro includes 500 connections and 500 messages per second. The free plan is fine for building and a small rehearsal.
3. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
4. Set a host password (the default in that file is `change-me`):

```sql
update public.settings
set host_password = 'a-long-secret'
where id = 1;
```

5. In Project Settings → API, copy the project URL and the **anon** public key. Do not put the service role key in this app.

## 2. Run it locally

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000/host](http://localhost:3000/host), enter the host password, and load your questions.

A QR code pointed at localhost will not open on the room’s phones. Deploy before the event.

## 3. Deploy

Deploy the Next.js app to [Vercel](https://vercel.com) (or any host that gives you a public HTTPS URL). Set the same two `NEXT_PUBLIC_` environment variables in the project, then redeploy.

Phones join at `https://your-domain/join?pin=123456`. That is the URL inside the QR code.

## 4. Run the event

1. Open `/host` on the projector laptop and leave that tab in front. The page asks the browser to keep the screen awake.
2. The lobby shows a PIN and a QR code. People can scan, or type the PIN.
3. Nicknames are unique, up to 16 characters. Joining closes when you press **Start quiz**.
4. The projector shows the question and four shapes: red triangle, blue diamond, yellow circle, green square. Phones show only the shapes.
5. The timer reveals the answer on its own. You can also press **Show answer**, then **Leaderboard**, then **Next question**.
6. The final screen is the top 3. Each phone shows that player’s own rank.

To stop early, press **End game** on any question or leaderboard screen. Everyone jumps to the final results. (Databases set up before this button existed need `supabase/schema.sql` run again; it is safe to re-run.)

If a phone sleeps, it reconnects with the same score as long as the browser keeps the site data.

To host another round, press **New room** and upload the questions again. The previous PIN stops accepting new players once a game has started.
