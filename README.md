# 🛢️ Drilling Simulation Project

A real-time, interactive **drilling operations simulation platform** built for educational and engineering training purposes. This project models key drilling parameters and allows users to visualize and control simulated drillin`g operations under various scenarios.

## 📌 Purpose

This simulator is designed to:
- Mimic real-world drilling conditions using simplified models.
- Help students and engineers understand how drilling parameters (WOB, RPM, flow rate, pressure, etc.) affect ROP and system behavior.
- Provide hands-on experience with making decisions in a simulated drilling environment.
- Support training, testing, and optimization of basic drilling control logic.

## 🚀 Features

- 🌀 **Real-time parameter updates** (ROP, WOB, RPM, SPM, pressure, torque).
- 🎛️ **Control panel** for changing input parameters (WOB, RPM, flow rate).
- 📈 **Dynamic plotting** of key performance metrics.
- 🧠 **Basic logic for bit wear and drilling efficiency**.
- 🛠️ Built-in **fault scenarios** for training and troubleshooting.
- 🧪 Modeled using simplified but realistic drilling equations.

## ⚙️ Tech Stack

| Layer          | Tech                                  |
|----------------|---------------------------------------|
| Frontend       | Next.js + recharts + three.js  |
| Simulation Core| JavaScript (custom physics engine)    |
| UI/UX          | TailwindCSS + ShadCN Components       |


---

## 🧮 Simulation Model

The drilling model is based on the following key relationships:

- Bit wear affects ROP efficiency over time.
- Flow rate influences hole cleaning efficiency.
- Torque and drag increase with depth and bit wear.

> Parameters are updated every second to simulate real-time conditions.

---

## 📸 Screenshots

![Capture1](https://github.com/user-attachments/assets/4951524a-91d7-40ae-b6ce-aa09d6cf4824)
![Capture2](https://github.com/user-attachments/assets/0e88ba89-6b1e-43fe-ab76-07f7b55ef8a6)


---

## 🧰 Getting Started

### Prerequisites

- Node.js (>= 18.x)
- npm or yarn

### Installation

```bash
git clone https://github.com/<your-username>/drilling-simulation.git
cd drilling-simulation
npm install
npm run dev
