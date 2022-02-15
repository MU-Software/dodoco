
/** @type { React.CSSProperties } */
const CutTextStyle = {
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
}

/** @type { React.CSSProperties } */
const PLItemStyle = {
  marginLeft: 2 + 'vw',
  marginRight: 2 + 'vw',
  padding: 8 + 'px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  borderTop: '1px solid #ddd',
}

/** @type { React.CSSProperties } */
const PLHeaderStyle = {
  ...PLItemStyle,
  borderTop: null,
  borderBottom: '1px solid #ddd',
}

/** @type { React.CSSProperties } */
const PLItemNameStyle = {
  ...CutTextStyle,
  width: 33 + "%",
}

/** @type { React.CSSProperties } */
const PLItemValueStyle = {
  ...CutTextStyle,
  width: 33 + "%",
}

const PLHeader3 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);

  return <div style={PLItemStyle}>
    <label htmlFor={randomId + 'qwe'} style={{
      ...PLItemNameStyle,
      fontWeight: "bold",
    }}>
      {props.name}
    </label>
    <label htmlFor={randomId} id={randomId + 'qwe'} style={{
      ...PLItemValueStyle,
      fontWeight: "bold",
    }}>
      {props.value1}
    </label>
    <div id={randomId} style={{
      ...PLItemValueStyle,
      fontWeight: "bold",
    }}>
      {props.value2}
    </div>
  </div>
}

const PLItem3 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);

  return <div style={PLItemStyle}>
    <label htmlFor={randomId + 'qwe'} style={PLItemNameStyle}>
      {props.name}
    </label>
    <label htmlFor={randomId} id={randomId + 'qwe'} style={PLItemValueStyle}>
      {props.value1}
    </label>
    <div id={randomId} style={PLItemValueStyle}>
      {props.value2}
    </div>
  </div>;
}

const PLInput3 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);

  return <div style={PLItemStyle}>
    <label htmlFor={randomId} style={PLItemNameStyle}>
      {props.name}
    </label>
    <input htmlFor={randomId} id={randomId + 'qwe'} value={props.state[props.value1Name]} onChange={props.onChange(props.value1Name)} style={PLItemValueStyle} />
    <input id={randomId} value={props.state[props.value2Name]} onChange={props.onChange(props.value2Name)} style={PLItemValueStyle} />
  </div>;
}

export { PLHeader3, PLItem3, PLInput3 };
