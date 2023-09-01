
# powermad-server

A back end for the Powermad MIDI sequencer/arpeggiator/MIDI sysex librarian.

# Requirements 

golang/gin
MongoDB
docker running

# Environment variables

## How to build and run

> make

This will build the docker container, stop and start it. 

## FAQ

Q: Why golang
A: I wanted to learn golang. I am enjoying it so far as it is very lightweight comparied to Next.js and Dropwizard (Java)

Q: Why MongoDB
A: It felt like Sequence and MidiChart were better implemented as complex data structures rather than spreading them across multiple tables. It would have been many many tables with few relations.

## Status

Not yet deployed so don't laugh


