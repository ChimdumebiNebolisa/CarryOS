# Carry demo script

Target length: 90–120 seconds. This walkthrough uses the seeded Calculus II scenario and the fixed demo clock: August 5, 2026 at 8:21 AM.

## 1. Open with the thesis (15 seconds)

Open `/` and say: “Carry connects the next commitment to what belongs in the backpack, when to leave, and what action is justified by evidence.” Point out the explicit simulated-prototype disclosure.

## 2. Run the evidence loop (35 seconds)

Use **Try the decision loop**:

1. Click **Close bag & scan**. The deterministic engine reports the calculator as not detected.
2. Explain that the missing state is based on a closed-bag scan, not an AI guess.
3. Click **Add calculator & rescan**. The same engine now reaches **Ready for Calculus II**.

## 3. Show the full product surface (25 seconds)

Click **Open full demo** or open `/demo`. Show the activity switcher, leave-by estimate, inventory memory, alert explanation drawer, sensor lab, and developer trace. Keep the “simulated RFID” label visible.

## 4. Show the model boundary (25 seconds)

In **AI carry profile**, describe a commitment such as “Calculus II exam in the Science Building.” Click **Generate carry profile**. Explain:

- With `OPENAI_API_KEY` and `OPENAI_MODEL` configured, the request goes server-side to the OpenAI Responses API with strict JSON schema output.
- Without model configuration or if the provider fails, the deterministic fallback is labeled.
- Click **Approve profile** to change the activity checklist. Before approval, the generated profile cannot change readiness.
- Unregistered suggestions remain outside readiness.

## 5. Close with boundaries (10 seconds)

State that the physical reader, maps, calendar, persistence, and native push delivery are future work. Browser notifications are optional and only requested after the user clicks **Enable browser alerts**.

## Reset between takes

On `/demo`, click **Reset** in Sensor lab. The seeded scenario returns to laptop, notebook, and Student ID present with calculator absent.
