
# powermad

Web-based MIDI sequencer/arpeggiator/MIDI sysex librarian. It lets you 
- Control your hardware MIDI synths from a web browser.
- Save sequences to the cloud and share them with others!

[!NOTE]
> Currently supports only Korg Minilogue XD.

# Requirements 

Client must run in a browser that supports MIDI, such as Opera or Chrome. Safari does not support MIDI.

See README in client/ and server/ for more details.

# Hosting

Client and server containers are hosted on AWS ECR and ECS.

## How to build and run

> docker compose up

see makefile for docker commands

The `client/` and `server/` folders have makefiles for working locally.

## How to release

To build containers and push them to ECR:

> docker compose build
> docker compose push

