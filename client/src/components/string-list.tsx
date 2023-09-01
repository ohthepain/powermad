import React, { useState } from "react"

const StringList = (props: any) => {

    const onUpdateList = props.onUpdateList
    const [values, setValues] = useState(['acid', 'techno'])

    // const addItem = (e: any) => {
    //     console.log(`removeGenre <${JSON.stringify(e)}>`)
    //     setGenres(genres.concat(e))
    //     onUpdateList(genres)
    // }

    const deleteItem = (e: any) => {
        console.log(`removeGenre <${JSON.stringify(e)}>`)
        setValues(['nice'])
        onUpdateList(values)
    }

    return (
        <div className="flexbox-row" onBlur={() => { console.log('left')}}>
            {values.map(genre => {
                return (
                    <div className="flexbox-item genre" key={genre}>
                        <button onClick={() => deleteItem(genre)}>{genre} <i className="fa-solid fa-xmark"></i></button>
                    </div>
                )
            })}
            <input onBlur={() => {console.log('duzz can ready to rock')}} className="flexbox-item genre"></input>
        </div>
    );
}

export default StringList;
