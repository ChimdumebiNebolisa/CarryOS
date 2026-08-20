# Hardware plan

Future physical work, not implemented in this prototype:

- UHF reader mounted in or near the backpack
- ESP32 or equivalent controller
- Passive tags on registered items
- Bag-state sensor for open/closed
- Power source and duty cycle experiments
- Calibration for metal placement, water bottles, and dense cable coils
- Outside-tag tests to understand false positives
- Performance questions: read time, missed tags, multipath

Do not add a runtime hardware adapter that appears implemented. The current sensor boundary is `src/adapters/inventory/simulated-rfid.ts`.
