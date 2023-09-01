
function throttle(callback: any, delay= 200) {
    let shouldWait = false
    let waitingArgs: any

    const timeoutFunc = () => {
        if (waitingArgs == null) {
            shouldWait = false
        } else {
            callback(...waitingArgs)
            waitingArgs = null
            setTimeout(timeoutFunc, delay)
        }
    }

    return (...args: any[]) => {
        if (shouldWait) {
            waitingArgs = args
            return
        }

        callback(...args)
        shouldWait = true
        setTimeout(timeoutFunc, delay)
    };
}


// export function blockWhile(callback: any, shouldBlock: () => boolean, delay = 2000) {
//     let isBlocking = false
//
//     const timeoutFunc = () => {
//         isBlocking = false
//     }
//
//     return (...args: any[]) => {
//         if (isBlocking && shouldBlock()) {
//             console.log(`block`)
//             return
//         }
//
//         callback(...args)
//         isBlocking = shouldBlock()
//         setTimeout(timeoutFunc, delay)
//     };
// }

export default throttle
