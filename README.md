![deusXmachina Logo](static/logo.png)

# Manifesto

Hello guys! A quick foreword about what we’re trying to achieve here and what drives us.

We’re currently a team of two:  
- [@pungys97](https://github.com/pungys97)  
- [@FilipKubis](https://github.com/FilipKubis)

We’re both software engineers with backgrounds in mechanical/electrical engineering. We started exploring the space of industrial tools because of the first [project](https://github.com/deusXmachina-dev/ProcessSimulatePlugin) we built together. While building that, we spoke to 50+ people at conferences like SPS Nürnberg and began noticing some fundamental issues in the industry.

The biggest? **Speed.**  
Seriously-what takes days in software (SaaS) takes *months* in industry. That increases the cost of tools, which further increases development time, which loops back into even higher costs… you get the idea. A self-reinforcing cycle. The side effect of all this is the pace of progress: it’s considered totally normal to call **20-year-old** software “state-of-the-art.” (*The little girl inside of me just died writing this.*)

We believe we might have a cure for that. Or rather, we realized the cure has been here all along-but people seem to prefer dying a slow and painful death (srsly, I mean **srsly**). The cure is called **open-source**, and we know it works because the entire software industry (as in SaaS) is being eaten by it.

Now we believe-and it’s yet to be proven-that we can take on the giants by removing the biggest obstacle in industrial software: **the speed of iteration**. If you can try stuff for free, freely extend it, and contribute your 2¢, innovation speed multiplies (or finally reaches something we can actually call *speed*).

After seeing a ton of tools, we decided to tackle the simulation space-specifically **Discrete Event Simulation**. These are extremely powerful tools, but they’re often underutilized for exactly the reasons described above.

That’s that for now. Welcome to your ...

---

# DEStiny

![DEStiny AGVs demo GIF](static/destiny.gif)

**DEStiny** is a discrete event simulation engine built on top of [SimPy](https://simpy.readthedocs.io/). It extends SimPy by adding a standardized layer for **recording simulation events** (such as movement) which can then be visualized in a [companion frontend application](https://destiny.deusxmachina.dev/).

This repository is a **monorepo** containing both the simulation engine and the visualization frontend.

## Project Structure

- **[Engine](src/engine/README.md)** - The Python simulation engine (`destiny-sim` package)
- **[Frontend](src/frontend/README.md)** - The React/Next.js web application for visualizing simulations

## Quick Links

- 📦 [Installation & Usage](src/engine/README.md#installation) - Get started with the Python engine
- 🎨 [Visualization Viewer](https://destiny.deusxmachina.dev/) - Web-based simulation viewer
- 📚 [Examples](src/engine/src/examples) - Example simulations
- 🚀 [Frontend Development](src/frontend/README.md) - Frontend setup and architecture

## License

MIT License
