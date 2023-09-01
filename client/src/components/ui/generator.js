"use strict";

function generate() {

    const SPEED_ANIM = 159;

    let canv, ctx;    // canvas and context
    let maxx, maxy;   // canvas dimensions

    let radius, nbx, nby, npt1, npt12;
    let grid;
    let perx, pery, tbPer;
    let hierar;

    // for animation
    let events;

    // shortcuts for Math.
    const mrandom = Math.random;
    const mfloor = Math.floor;
    const mround = Math.round;
    const mceil = Math.ceil;
    const mabs = Math.abs;
    const mmin = Math.min;
    const mmax = Math.max;

    const mPI = Math.PI;
    const mPIS2 = Math.PI / 2;
    const mPIS3 = Math.PI / 3;
    const m2PI = Math.PI * 2;
    const m2PIS3 = Math.PI * 2 / 3;
    const msin = Math.sin;
    const mcos = Math.cos;
    const mtan = Math.tan;
    const matan2 = Math.atan2;

    const mhypot = Math.hypot;
    const msqrt = Math.sqrt;

    const sqrt3 = msqrt(3);
    const hsqrt3 = msqrt(3) / 2;

    //------------------------------------------------------------------------

    function alea(mini, maxi) {
        // random number in given range
        if (typeof (maxi) == 'undefined') return mini * mrandom(); // range 0..mini
        return mini + mrandom() * (maxi - mini); // range mini..maxi
    }
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    function intAlea(mini, maxi) {
        // random integer in given range (mini..maxi - 1 or 0..mini - 1)
        //
        if (typeof (maxi) == 'undefined') return mfloor(mini * mrandom()); // range 0..mini - 1
        return mini + mfloor(mrandom() * (maxi - mini)); // range mini .. maxi - 1
    }


    //------------------------------------------------------------------------
    // for curves inside circles
    //------------------------------------------------------------------------

    function calcAlpha(angle, beta) {

        const mc = mabs(mcos(angle / 2));
        if (mc < 1e-3) return 0.4845;
        return 1.3333333333333333333 * (1 - beta / mc);

    } // calcAlpha

    function arcPerp(th0, th1, alpha) {

        /* for a unity circle centered in (0, 0) returns values for a bezier cubic curve
        perpendicular to circle
        connecting point at angle th0 to point at angle th1 at distance alpha from centre
        */
        let angle = mabs(th0 - th1);
        if (angle > mPI) angle = m2PI - angle;

        alpha = 1 - calcAlpha(angle, alpha);
        const mc0 = mcos(th0);
        const ms0 = msin(th0);
        const mc1 = mcos(th1);
        const ms1 = msin(th1);

        return [{ x: mc0, y: ms0 },
        { x: alpha * mc0, y: alpha * ms0 },
        { x: alpha * mc1, y: alpha * ms1 },
        { x: mc1, y: ms1 }];
    }

    function autoArcPerp(th0, th1) {
        /* like arc, but alpha is evaluated automatically so as to have :
            - angle 0 -> alpha = 1
            - angle 2pi/3 -> alpha = petit
        */
        let angle = mabs(th0 - th1) % m2PI;    // 0 .. 2 pi
        if (angle > mPI) angle = m2PI - angle; // 0 .. pi
        let alpha = 1.0 - 1.3333 * angle / mPI;
        alpha = 1.0 - calcAlpha(angle, alpha);
        const mc0 = mcos(th0);
        const ms0 = msin(th0);
        const mc1 = mcos(th1);
        const ms1 = msin(th1);

        return [{ x: mc0, y: ms0 },
        { x: alpha * mc0, y: alpha * ms0 },
        { x: alpha * mc1, y: alpha * ms1 },
        { x: mc1, y: ms1 }];
    }

    function scaleArc(arc, xc, yc, radius) {

        return arc.map(p => ({ x: p.x * radius + xc, y: p.y * radius + yc })); // apply radius and position of center
    }

    //------------------------------------------------------------------------
    // for curves between circles
    //------------------------------------------------------------------------
    function normalizedRadiiConnection(anglec, angle, alpha) {
        /* connection line between two tangent circles of radius 1
        the fist circle has its center in (0,0)
        the second circle has its center in (cos(anglec),sin(anglec))

        angle is a direction (0 = horizontally rightwards, pi/2 = downwards)
        alpha is a factor : 0 => Bézier curve will be a straignt line, 1 => Bézier curve will be (almost) a circle arc
        alpha > 1 is possible, alpha < 0 is not
        The curve connects "smoothly" the radius from first circle in direction alpha, to the radius in second circle symmetrical of (radius in c1)
        with respect to the symmetry axis of the two circles
    */
        const dx = mcos(anglec);
        const dy = msin(anglec);
        const ca = mcos(angle);
        const sa = msin(angle);
        const c = (ca * dx + sa * dy); // if < 0 , problems are to be expected...
        const cu = c;
        const s = (sa * dx - ca * dy);
        const su = s;
        const cb = dx;
        const sb = dy;
        const p0 = { x: ca, y: sa };
        const ddx = - c * cb - s * sb;
        const ddy = - c * sb + s * cb
        const p3 = {
            x: 2 * dx + ddx,
            y: 2 * dy + ddy
        };

        const rad = msqrt((1 - cu) / (1 + cu));
        const beta = rad * mabs(((mabs(su) < 0.01) ? (2 * su * alpha / 3) : (1.3333333333 * alpha * (1 - cu) / su))); // distance between control points and ends of arc
        const p1 = { x: p0.x + beta * ca, y: p0.y + beta * sa };
        const p2 = {
            x: p3.x + beta * ddx,
            y: p3.y + beta * ddy
        };
        return [p0, p1, p2, p3];
    }

    //------------------------------------------------------------------------
    function reverseArc(arc) {
        return [arc[3], arc[2], arc[1], arc[0]];
    }

    //------------------------------------------------------------------------
    function drawLoop(loop, hue) {
        let first = true;
        loop.arcs.forEach(pair => {
            drawOnePair(pair, first);
            first = false;
        });
        ctx.strokeStyle = "#000";
        ctx.lineWidth = mmin(1.5, radius / npt12);
        //    if (loop.closed) {
        ctx.closePath();
        ctx.fillStyle = `hsl(${hue},100%,50%)`;
        ctx.fill();
        ctx.stroke();

        //    } else ctx.stroke();
    }
    //------------------------------------------------------------------------
    function reversePair(pair) {
        if (pair.type == "outer")
            return { type: "outer", k0: pair.k1, circ0: pair.circ1, k1: pair.k0, circ1: pair.circ0, arc: reverseArc(pair.arc), turn: -pair.turn };
        if (pair.type == "inner")
            return { type: "inner", k0: pair.k1, k1: pair.k0, circ: pair.circ, arc: reverseArc(pair.arc), turn: -pair.turn };
    }

    //------------------------------------------------------------------------
    function reverseLoop(loop) {
        loop.arcs = loop.arcs.map(pair => reversePair(pair)).reverse();
        if (loop.turn !== undefined) loop.turn = - loop.turn;
        return loop;
    }
    //------------------------------------------------------------------------
    function whichSide(k, circ) {
        // returns 0 for N, 1 for E, 2 for S and 3 for W
        // for given point index of given circle

        let side;
        if (circ.ky == 0 && k >= npt12 / 2) return 0;  // N
        if (circ.ky == grid.length - 1 && k < npt12 / 2) return 2; // S
        if (circ.kx == grid[circ.ky].length - 1 && !(k >= npt12 / 4 && k < 3 * npt12 / 4)) return 1; // E
        if (circ.kx == 0 && k >= npt12 / 4 && k < 3 * npt12 / 4) return 3; // W
    }
    //------------------------------------------------------------------------
    function closeOpenLoop(loop) {

        // the loops are closed in such a way that they turn positively (clockwise)

        const pa = loop.arcs[0].k0;
        const circa = loop.arcs[0].circ;
        const pb = loop.arcs[loop.arcs.length - 1].k1;
        const circb = loop.arcs[loop.arcs.length - 1].circ;
        let sidea = whichSide(pa, circa);
        let sideb = whichSide(pb, circb);
        let xa = circa.xc + radius * mcos((pa + 0.5) * m2PI / npt12);
        let ya = circa.yc + radius * msin((pa + 0.5) * m2PI / npt12);
        let xb = circb.xc + radius * mcos((pb + 0.5) * m2PI / npt12);
        let yb = circb.yc + radius * msin((pb + 0.5) * m2PI / npt12);
        // close the loop = connect pb, circb on side sideb to pa, circa on side sidea
        // this is done by a adding to loop.arcs a new type of pair : "straight", beginning with pb, ending with pa, and with 1 or 2 intermediate points
        const narc = { type: "straight", k0: pb, circ0: circb, k1: pa, circ1: circa, arc: [{ x: xb, y: yb }] }; // new arc to be added at end of loop.arcs - intermediate points may be added

        switch ((sidea - sideb + 4) % 4) {
            case 0: // on same side
                switch (sideb) {
                    case 0: // top
                        if (xa < xb) reverseNarcAndLoop();
                        narc.arc.push({ x: (xa + xb) / 2, y: grid.ymin });
                        break;
                    case 1: // right
                        if (ya < yb) reverseNarcAndLoop();
                        narc.arc.push({ x: grid.xmax, y: (ya + yb) / 2 });
                        break;
                    case 2: // bottom
                        if (xa > xb) reverseNarcAndLoop();
                        narc.arc.push({ x: (xa + xb) / 2, y: grid.ymax });
                        break;
                    case 3: // left
                        if (ya > yb) reverseNarcAndLoop();
                        narc.arc.push({ x: grid.xmin, y: (ya + yb) / 2 });
                        break;
                }
                break;

            case 3: // around a corner, turning negative direction
                reverseNarcAndLoop(); // to positive direction
            case 1: // around a corner, turning positive direction
                switch (sideb) {
                    case 0:
                        narc.arc.push({ x: xb, y: grid.ymin });
                        narc.arc.push({ x: grid.xmax, y: grid.ymin });
                        narc.arc.push({ x: grid.xmax, y: ya });
                        break;
                    case 1:
                        narc.arc.push({ x: grid.xmax, y: yb });
                        narc.arc.push({ x: grid.xmax, y: grid.ymax });
                        narc.arc.push({ x: xa, y: grid.ymax });
                        break;

                    case 2:
                        narc.arc.push({ x: xb, y: grid.ymax });
                        narc.arc.push({ x: grid.xmin, y: grid.ymax });
                        narc.arc.push({ x: grid.xmin, y: ya });
                        break;
                    case 3:
                        narc.arc.push({ x: grid.xmin, y: yb });
                        narc.arc.push({ x: grid.xmin, y: grid.ymin });
                        narc.arc.push({ x: xa, y: grid.ymin });
                        break;

                }
                break;

            case 2: // on opposite sides
                switch (sideb) {
                    case 0:
                        reverseNarcAndLoop(); // to positive direction
                    case 2:
                        narc.arc.push({ x: xb, y: grid.ymax });
                        narc.arc.push({ x: grid.xmin, y: grid.ymax });
                        narc.arc.push({ x: grid.xmin, y: grid.ymin });
                        narc.arc.push({ x: xa, y: grid.ymin });
                        break;
                    case 1:
                        reverseNarcAndLoop(); // to positive direction
                    case 3:
                        narc.arc.push({ x: grid.xmin, y: yb });
                        narc.arc.push({ x: grid.xmin, y: grid.ymin });
                        narc.arc.push({ x: grid.xmax, y: grid.ymin });
                        narc.arc.push({ x: grid.xmax, y: ya });
                        break;
                }
                break;
        }
        narc.arc.push({ x: xa, y: ya });
        loop.arcs.push(narc);

        function reverseNarcAndLoop() {
            [narc.k0, narc.k1] = [narc.k1, narc.k0];
            [narc.circ0, narc.circ1] = [narc.circ1, narc.circ0];
            narc.arc = [{ x: xa, y: ya }]; // we will start by previous point a instead of b
            reverseLoop(loop);
            [sidea, sideb] = [sideb, sidea];
            [xa, xb] = [xb, xa];
            [ya, yb] = [yb, ya];
        }
    }
    //------------------------------------------------------------------------

    function createLoop(circ, k, nloop) {

        let loop = { nloop, arcs: [] };

        do {
            if (circ.pairs[k].nloop !== undefined) {
                loop.closed = true;
                return loop;
            }
            loop.arcs.push(circ.pairs[k]);
            circ.pairs[k].nloop = nloop; // on note que cet arc est utilisé dans nloop
            circ.pairs[circ.pairs[k].k1].nloop = nloop; // on note que l'opposé l'est aussi
            // passage à la suite (triangles)
            let next = circ.triangles[circ.pairs[k].k1];
            if (next === undefined) {
                loop.closed = false;
                return loop; // fini
            }
            loop.arcs.push(next);
            next.nloop = nloop; // on note que cet arc est utilisé dans nloop
            next.circ1.triangles[next.k1].nloop = nloop; // // on note que l'opposé l'est aussi
            k = next.k1;
            circ = next.circ1;

        } while (true);

    } // createLoop

    function createLoops() {

        let loops = [];
        // starting from edges ("open loops" => not actual loops)
        grid.forEach(lgrid => lgrid.forEach(cell => {
            for (let k = 0; k < npt12; ++k) {
                if (cell.triangles[k]) continue; // not an edge
                if (cell.pairs[k].nloop !== undefined) continue; // already belongs to a loop
                let loop = createLoop(cell, k, loops.length);
                closeOpenLoop(loop);
                loops.push(loop);
            }
        }));
        // true loops now
        grid.forEach(lgrid => lgrid.forEach(cell => {
            for (let k = 0; k < npt12; ++k) {
                if (cell.pairs[k].nloop !== undefined) continue; // already belongs to a loop
                let loop = createLoop(cell, k, loops.length);
                // evaluate loop rotation
                loop.turn = loop.arcs.reduce((sum, arc) => sum + arc.turn, 0);
                if (loop.turn < 0) loop = reverseLoop(loop);
                loops.push(loop);

            }
        }));

        return loops;
    }

    function prioritizeLoops(tbLoops) {

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        function apeerb(a, b) {
            // "hierar" already containing a, adds b as a peer of a
            //    a.parent.innerHier = a.parent.innerHier ||[];
            a.parent.innerHier.push(b.found); // b is added as child of a's parent
        } // apeerb

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        function asurroundsb(a, b) {
            // "hierar" already containing a, adds b as a's child
            a.found.innerHier.push(b.found); // b is added 'inside' a
        } // asurroundsb

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        function bsurroundsa(a, b) {
            /* "hierar" already containing a, adds b as direct parent of a and a's peers
            */

            let par = a.parent;
            while (par.innerHier.length > 0) {
                b.found.innerHier.push(par.innerHier.shift()); // adds a or a peer to b
            } // while

            par.innerHier.push(b.found);          // b is added to former parent of a

        } // bsurroundsa

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        // tries to find particular loop given by kb in (sub-)hierarchy given by included
        function find(included, kb) {
            let result;
            let parent = included;
            for (let k = 0; k < parent.innerHier.length; ++k) {
                if (parent.innerHier[k].kLoop == kb) return { parent: parent, found: parent.innerHier[k] };
                if (result = find(parent.innerHier[k], kb)) return result;
            }
            return false;
        } // find

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        /* The loops are designated by their index in tbLoops
        the representation of one loop in the hierarchy is an array whose fist element
        is the index of this loop, and the others elements are the representation
        of -if any- the loops immediatly included in the firs one.

        By example, 0 designates a loop [0] the hierachical representation of this loop
        if it surrounds no other loop

        other example : if loop 0 contains loops 2 and 3, and loop 3 contains loop 4, this will
        be represented by hierar = [0,[2,[4]],[3]]
        The top level of this hierarchy is the outside world, represented by indes -1
        */
        /*
            We shall create a table of loops to be examined, initialized with a single loop.
            We will go through this loop and, at every exit point of a circle, determinate
            the hierarchical relation between the current loop and the loop which passes by
            the two neighbour points : a surrounds b, b surrounds a or a and b at the same level.
            The indexes of the encountered loops will be added to the list of loops to be
            examined, if they are not already in this list.
            Two loops passing by neighbours points can only be immediate parent, child of
            sibling of each other. Their relation can be deduced from the order of the two
            neighbour points, and the fact that all loops turns clockwise

        */

        // beginning of function prioritizeLoops() {

        let kb;      // index in toBeExamined
        let loopa;   // loop we are running
        let loopb;   // loop neighbour of loopa
        let kLoopa, kLoopb; // indexes of loopa and loopb
        let descHierA, descHierB; // hierarchical descriptions of loopa and loopb

        let toBeExamined = [0];    // table of loops to be examined, let us begin with just 0
        let kneigh, pointNeigh;

        hierar = { kLoop: -1, innerHier: [{ kLoop: 0, innerHier: [] }] };     // let us create a hierarchy where loop 0 is the only loop included in the universe (-1)

        /* first, let us run through every end of every arc of every loop, and mark points with their loop number and if they are entries or exit
        This information is the key to prioritizing loops */

        tbLoops.forEach(loop => {
            loop.arcs.forEach(arc => {
                if (arc.type != "inner") return;
                if (!arc.circ.points) arc.circ.points = [];
                arc.circ.points[arc.k0] = { nloop: loop.nloop, entry: true };
                arc.circ.points[arc.k1] = { nloop: loop.nloop, entry: false };
            });
        });

        for (kb = 0; kb < toBeExamined.length; ++kb) {
            /* toBeExamined will be extended inside the 'for' loop, but
            kb will allways catch up with toBeExamined.length */

            /* look for current loop and its parent in 'hierar' */
            kLoopa = toBeExamined[kb];
            loopa = tbLoops[kLoopa];

            loopa.arcs.forEach(pair => {
                if (pair.type != "inner") return; // only interested in parts in circles

                kneigh = (pair.k0 + npt12 - 1) % npt12; // neighbour "-1" of current entry point
                pointNeigh = pair.circ.points[kneigh];
                kLoopb = pointNeigh.nloop;
                if (toBeExamined.indexOf(kLoopb) == -1) { // if neighbour loop not studied yet
                    descHierA = find(hierar, kLoopa);
                    toBeExamined.push(kLoopb);              // add it to toBeExamined
                    descHierB = { found: { kLoop: kLoopb, innerHier: [] } };
                    asurroundsb(descHierA, descHierB);
                } // if unknown (yet) neighbor -1

                kneigh = (pair.k0 + 1) % npt12; // neighbour "+1" of current entry point
                pointNeigh = pair.circ.points[kneigh];
                kLoopb = pointNeigh.nloop;
                if (toBeExamined.indexOf(kLoopb) == -1) { // if neighbour loop not studied yet
                    descHierA = find(hierar, kLoopa);
                    toBeExamined.push(kLoopb);              // add it to toBeExamined
                    descHierB = { found: { kLoop: kLoopb, innerHier: [] } };
                    if (pointNeigh.entry) {
                        bsurroundsa(descHierA, descHierB);
                    } else {
                        apeerb(descHierA, descHierB);
                    }
                } // if unknown (yet) neighbor -1
                // now let us watch the exit point of current arc
                kneigh = (pair.k1 + npt12 - 1) % npt12; // neighbour "-1" of current exit point
                pointNeigh = pair.circ.points[kneigh];
                kLoopb = pointNeigh.nloop;
                if (toBeExamined.indexOf(kLoopb) == -1) { // if neighbour loop not studied yet
                    descHierA = find(hierar, kLoopa);
                    toBeExamined.push(kLoopb);              // add it to toBeExamined
                    descHierB = { found: { kLoop: kLoopb, innerHier: [] } };
                    if (pointNeigh.entry) {
                        apeerb(descHierA, descHierB);
                    } else {
                        bsurroundsa(descHierA, descHierB);
                    }
                } // if unknown (yet) neighbor -1

                kneigh = (pair.k1 + 1) % npt12; // neighbour "+1" of current exit point
                pointNeigh = pair.circ.points[kneigh];
                kLoopb = pointNeigh.nloop;
                if (toBeExamined.indexOf(kLoopb) == -1) { // if neighbour loop not studied yet
                    descHierA = find(hierar, kLoopa);
                    toBeExamined.push(kLoopb);              // add it to toBeExamined
                    descHierB = { found: { kLoop: kLoopb, innerHier: [] } };
                    asurroundsb(descHierA, descHierB);
                } // if unknown (yet) neighbor -1
            });

        } // for kb

        /* computes hierarchy level of each loop
            and maxDepth of included loops
            0 for background
            1 for outermost loop(s)
            ..
        */
        (function analyseDepth(hier, level) {
            hier.depth = level;
            let maxDepth = level;
            hier.innerHier.forEach(inHier => {
                analyseDepth(inHier, level + 1);
                maxDepth = mmax(maxDepth, inHier.maxDepth);
            });
            hier.maxDepth = maxDepth;
        }(hierar, 0));

    } // prioritizeLoops
    //------------------------------------------------------------------------
    //-----------------------------------------------------------------------------

    function drawEverything(tbLoops) {

        (function drawHierar(hier, hue) {
            if (hier.kLoop == -1) {
                hue = intAlea(360);
                ctx.fillStyle = `hsl(${hue},100%,50%)`;
                ctx.fillRect(0, 0, maxx, maxy);
            } // if background
            else {
                drawLoop(tbLoops[hier.kLoop], hue);
            }
            hier.innerHier.forEach(hierar => drawHierar(hierar, (hue + intAlea(100,260)) % 360 ));
        })(hierar) //

    } // drawEverything

    //------------------------------------------------------------------------
    class Cell {

        constructor(kx, ky) {
            this.kx = kx;
            this.ky = ky;
        }

    } // class Cell

    class Circle extends Cell {
        constructor(kx, ky) {
            super(kx, ky);

        }

        innerCurves() {
            let orient = intAlea(npt12);
            //        orient = ( 3 * this.kx  + 3 * this.ky) % npt12;
            orient = tbPer[this.ky % pery][this.kx % perx];

            this.pairs = [];
            for (let k = 0; k < npt12 / 6; ++k) {
                let pair = { type: "inner", k0: (k + orient) % npt12, k1: (npt12 / 3 - k - 1 + orient) % npt12, circ: this };
                pair.arc = scaleArc(autoArcPerp((pair.k0 + 0.5) / npt12 * m2PI, (pair.k1 + 0.5) / npt12 * m2PI),
                    this.xc, this.yc, radius);
                this.pairs[pair.k0] = pair;
                this.pairs[pair.k1] = reversePair(pair);

                pair = { type: "inner", k0: (k + npt12 / 3 + orient) % npt12, k1: (2 * npt12 / 3 - k - 1 + orient) % npt12, circ: this };
                pair.arc = scaleArc(autoArcPerp((pair.k0 + 0.5) / npt12 * m2PI, (pair.k1 + 0.5) / npt12 * m2PI),
                    this.xc, this.yc, radius);
                this.pairs[pair.k0] = pair;
                this.pairs[pair.k1] = reversePair(pair);

                pair = { type: "inner", k0: (k + 2 * npt12 / 3 + orient) % npt12, k1: (npt12 - k - 1 + orient) % npt12, circ: this };
                pair.arc = scaleArc(autoArcPerp((pair.k0 + 0.5) / npt12 * m2PI, (pair.k1 + 0.5) / npt12 * m2PI),
                    this.xc, this.yc, radius);
                this.pairs[pair.k0] = pair;
                this.pairs[pair.k1] = reversePair(pair);

            }
            // computes direction change (integer, in 1/npt12 turns - positive clockwise)

            this.pairs.forEach(p => {
                let d = p.k1 - p.k0 - npt12 / 2;
                while (d <= -npt12 / 2) d += npt12;
                while (d > npt12 / 2) d -= npt12;
                p.turn = d;
            })
        } // innerCurves

        outerCurves() {
            /* defines the curves which connect a circle to its neighbor (cir1)
                    divided into up to 6 areas, corresponding to the 6 curved triangles surrounding each circle
                    areas: 0 = SE, 1 = S, 2 = SW, 3 = NW, 4 = N, 5 = NE
            */
            let neigh, sum;

            this.triangles = [];
            const alphatri = 1.0;
            neigh = { x: this.kx + 1, y: this.ky };
            sum = 0 + npt12 / 2 - 1;
            if (grid[neigh.y] && grid[neigh.y][neigh.x]) {
                /* triangle 0 */
                for (let kp = 0; kp < npt1; ++kp) {
                    /* absolutely not optimized : normalizedRadiiConnection should be calculated only
                        once, and re-used in all triangles with the appropriate denormalizeRadiiConnection  */
                    let pair = { type: "outer", circ0: this, k0: kp, circ1: grid[neigh.y][neigh.x], k1: (sum - kp) % npt12 };
                    pair.arc = scaleArc(normalizedRadiiConnection(0, (kp + 0.5) * m2PI / npt12, alphatri),
                        this.xc, this.yc, radius);
                    this.triangles[kp] = pair;
                    pair.turn = -(1 + 2 * (kp - 0));
                }
            } // triangle 0

            neigh = { x: this.kx + this.shortRow, y: this.ky + 1 };
            sum += 4 * npt1;
            if (grid[neigh.y] && grid[neigh.y][neigh.x]) {
                /* triangle 1 */
                for (let kp = 2 * npt1; kp < 3 * npt1; ++kp) {
                    let pair = { type: "outer", circ0: this, k0: kp, circ1: grid[neigh.y][neigh.x], k1: (sum - kp) % npt12 };
                    pair.arc = scaleArc(normalizedRadiiConnection(mPI / 3, (kp + 0.5) * m2PI / npt12, alphatri),
                        this.xc, this.yc, radius);
                    this.triangles[kp] = pair;
                    pair.turn = -(1 + 2 * (kp - 2 * npt1));
                }
            } // triangle 1

            neigh = { x: this.kx + this.shortRow - 1, y: this.ky + 1 };
            sum += 4 * npt1;
            if (grid[neigh.y] && grid[neigh.y][neigh.x]) {
                /* triangle 2 */
                for (let kp = 4 * npt1; kp < 5 * npt1; ++kp) {
                    let pair = { type: "outer", circ0: this, k0: kp, circ1: grid[neigh.y][neigh.x], k1: (sum - kp) % npt12 };
                    pair.arc = scaleArc(normalizedRadiiConnection(2 * mPI / 3, (kp + 0.5) * m2PI / npt12, alphatri),
                        this.xc, this.yc, radius);
                    this.triangles[kp] = pair;
                    pair.turn = -(1 + 2 * (kp - 4 * npt1));
                }
            } // triangle 2

            neigh = { x: this.kx - 1, y: this.ky };
            sum += 4 * npt1;
            if (grid[neigh.y] && grid[neigh.y][neigh.x]) {
                /* triangle 3 */
                for (let kp = 6 * npt1; kp < 7 * npt1; ++kp) {
                    let pair = { type: "outer", circ0: this, k0: kp, circ1: grid[neigh.y][neigh.x], k1: (sum - kp) % npt12 };
                    pair.arc = scaleArc(normalizedRadiiConnection(3 * mPI / 3, (kp + 0.5) * m2PI / npt12, alphatri),
                        this.xc, this.yc, radius);
                    this.triangles[kp] = pair;
                    pair.turn = -(1 + 2 * (kp - 6 * npt1));
                }
            } // triangle 3

            neigh = { x: this.kx + this.shortRow - 1, y: this.ky - 1 };
            sum += 4 * npt1;
            if (grid[neigh.y] && grid[neigh.y][neigh.x]) {
                /* triangle 4 */
                for (let kp = 8 * npt1; kp < 9 * npt1; ++kp) {
                    let pair = { type: "outer", circ0: this, k0: kp, circ1: grid[neigh.y][neigh.x], k1: (sum - kp) % npt12 };
                    pair.arc = scaleArc(normalizedRadiiConnection(4 * mPI / 3, (kp + 0.5) * m2PI / npt12, alphatri),
                        this.xc, this.yc, radius);
                    this.triangles[kp] = pair;
                    pair.turn = -(1 + 2 * (kp - 8 * npt1));
                }
            } // triangle 4

            neigh = { x: this.kx + this.shortRow, y: this.ky - 1 };
            sum += 4 * npt1;
            if (grid[neigh.y] && grid[neigh.y][neigh.x]) {
                /* triangle 5 */
                for (let kp = 10 * npt1; kp < 11 * npt1; ++kp) {
                    let pair = { type: "outer", circ0: this, k0: kp, circ1: grid[neigh.y][neigh.x], k1: (sum - kp) % npt12 };
                    pair.arc = scaleArc(normalizedRadiiConnection(5 * mPI / 3, (kp + 0.5) * m2PI / npt12, alphatri),
                        this.xc, this.yc, radius);
                    this.triangles[kp] = pair;
                    pair.turn = -(1 + 2 * (kp - 10 * npt1));
                }
            } // triangle 5

        } // outerCurves

        draw() {
            ctx.beginPath();
            ctx.arc(this.xc, this.yc, radius, 0, m2PI);
            ctx.strokeStyle = "#ff0";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        draw0(pairs) { /* might be a static method as well */
            pairs.forEach(pair => {
                drawOnePair(pair);
                ctx.strokeStyle = "#ff0";
                ctx.lineWidth = 1.5;
                ctx.stroke();
            })
        }

        draw1() {
            this.draw0(this.pairs);
        } // draw1

        draw2() {
            this.draw0(this.triangles);
        } // draw1

    } // class Cercle

    function drawOnePair(pair, start = true) {
        if (start) {
            ctx.beginPath();
            ctx.moveTo(pair.arc[0].x, pair.arc[0].y);
        }
        if (pair.type == "straight") {
            for (let k = 1; k < pair.arc.length; ++k) {
                ctx.lineTo(pair.arc[k].x, pair.arc[k].y);
            }

        } else {
            ctx.bezierCurveTo(pair.arc[1].x, pair.arc[1].y,
                pair.arc[2].x, pair.arc[2].y,
                pair.arc[3].x, pair.arc[3].y);
        }
    } // drawOnePair

    //------------------------------------------------------------------------

    let animate;

    { // scope for animate

        let animState = 0;

        animate = function (tStamp) {

            let event;
            let tinit;

            event = events.shift();
            if (event && event.event == 'reset') animState = 0;
            if (event && event.event == 'click') animState = 0;
            window.requestAnimationFrame(animate)

            tinit = performance.now();

            do {

                switch (animState) {

                    case 0:
                        if (startOver()) {
                            ++animState;
                        }
                        break;

                    case 1:
                        ++animState;
                        break;

                    case 2:
                        break;

                } // switch
            } while ((animState == 1) && (performance.now() - tinit < SPEED_ANIM));

        } // animate
    } // scope for animate

    //------------------------------------------------------------------------

    //------------------------------------------------------------------------

    function startOver() {

        // canvas dimensions

        maxx = window.innerWidth;
        maxy = window.innerHeight;
        canv.width = maxx;
        canv.height = maxy;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, maxx, maxy);

        do {
        // basic circle radius
            radius = msqrt(maxx * maxy / intAlea(100, 1000));
        // division of circles
            npt1 = 1 + mfloor(10 * Math.random());
            npt12 = 12 * npt1;
        } while (radius * m2PI / npt12 < 5); // avoid too thin shapes

        // want a circle center at the center of the screen -> odd numbes of columns/ rows
        nbx = mceil(maxx / radius / 2 + 1) | 1; // on middle row and rows with same parity, nbx - 1 on others
        nby = mceil(maxy / radius / sqrt3 + 1) | 1;

        //    nbx -= 4;
        //    nby -= 4;
        // create grid
        grid = [];
        let midy = mfloor(nby / 2); // middle row
        let midx = mfloor(nbx / 2); // middle column (long rows)
        for (let ky = 0; ky < nby; ++ky) {
            grid[ky] = [];
            let y = maxy / 2 + (ky - midy) * radius * sqrt3;
            let shortRow = (mabs(ky - midy) & 1) ? 1 : 0;
            for (let kx = 0; kx < nbx - shortRow; ++kx) {
                grid[ky][kx] = new Circle(kx, ky);
                grid[ky][kx].shortRow = shortRow;
                grid[ky][kx].yc = y;
                grid[ky][kx].xc = maxx / 2 + 2 * radius * (kx - midx + 0.5 * shortRow);
                grid[ky][kx].draw();
            }

        } // for ky

        // four positions 1 radius away out of the grid - will be used to close open loops
        grid.xmin = maxx / 2 - (2 * midx + 2) * radius;
        grid.xmax = maxx / 2 + (2 * midx + 2) * radius;
        grid.ymin = maxy / 2 - (midy * msqrt(3) + 2) * radius;
        grid.ymax = maxy / 2 + (midy * msqrt(3) + 2) * radius;

        perx = intAlea(1, 4);
        pery = intAlea(1, 4);

        if (intAlea(2)) {   // make it aperiodic
            perx = nbx;
            pery = nby;

        }
        tbPer = [];
        for (let ky = 0; ky < pery; ++ky) {
            tbPer[ky] = [];
            for (let kx = 0; kx < perx; ++kx) {
                tbPer[ky][kx] = intAlea(npt12);
            }
        }

        grid.forEach(line => line.forEach(cell => {
            cell.innerCurves();
            //        cell.draw1();
            cell.outerCurves();
            //        cell.draw2();
        }));

        // associate "outer curves" with their 2nd end
        grid.forEach(line => line.forEach(cell => {
            cell.triangles.forEach(pair => {
                pair.circ1.triangles[pair.k1] = reversePair(pair);
            });
            //        cell.draw2();
        }));

        let loops = createLoops();

        prioritizeLoops(loops);

        drawEverything(loops);
    } // startOver

    canv = document.createElement('canvas');
    canv.style.position = "absolute";
    document.body.appendChild(canv);
    ctx = canv.getContext('2d');
    // canv.setAttribute('title', 'click me');

    requestAnimationFrame(animate);
}
