# Carry hardware integration plan

This document describes the next phase. It is a plan, not a claim that physical RFID behavior has been validated.

## Target hardware boundary

- **Reader:** M5Stack UHF RFID Unit.
- **Controller:** ESP32 or compatible controller.
- **Transport:** UART between the controller and reader; the application-side adapter will preserve the `InventorySensor` contract used by `SimulatedRFIDReader`.
- **Tags:** passive UHF RFID tags selected for the object material and placement.
- **Bag state:** magnetic zipper or flap sensor, reported alongside tag observations.
- **Power:** USB battery / power bank with measured runtime under the selected scan duty cycle.

## Initial placement plan

Use a sleeve, fabric loop, or protected surface for each tag. Avoid putting a tag directly against laptop metal, dense cable coils, or a metal key ring until those placements are measured. Water bottles should use a fabric sleeve or non-metallic carrier where possible.

The first software-to-hardware adapter should report raw tag ID, timestamp, signal strength, read count, bag state, source, and any proximity hint without converting uncertain readings into confirmed presence.

## Calibration experiments

1. **Basic inventory:** six tagged objects, one backpack, ten repeated closed-bag scans; record per-item detection rate.
2. **Outside-tag rejection:** place one tagged item beside the bag at multiple distances; record false-presence rate.
3. **Metal-object placement:** compare a tag directly on a laptop, on a laptop sleeve, and an on-metal tag if available.
4. **Occlusion and packing order:** test top, bottom, between laptop/notebook, and next to the water bottle.
5. **Power calibration:** compare transmit power levels and choose the minimum reliable setting.

Record scan duration, heat, power draw, antenna placement, read failures, and environmental conditions for every run. Thresholds in the software prototype are demonstration defaults, not validated physical defaults.

## Open questions before hardware purchase

- Can the selected reader support the required multi-tag read cadence inside the chosen backpack?
- How much false detection occurs for tags outside the bag at common distances?
- Does the bag material or laptop shielding require a second antenna or a revised tag placement?
- How should zipper state and partial-open scans be represented in the adapter contract?
