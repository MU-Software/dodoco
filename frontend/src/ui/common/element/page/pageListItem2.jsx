
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
  width: 50 + "%",
}

/** @type { React.CSSProperties } */
const PLItemValueStyle = {
  ...CutTextStyle,
  width: 50 + "%",
}

const PLHeader2 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);

  return <div style={PLHeaderStyle}>
    <label htmlFor={randomId} style={{
      ...PLItemNameStyle,
      fontWeight: "bold",
    }}>
      {props.name}
    </label>
    <div id={randomId} style={{
      ...PLItemValueStyle,
      fontWeight: "bold"
    }}>
      {props.value}
    </div>
  </div>;
}

const PLItem2 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);

  return <div style={PLItemStyle}>
    <label htmlFor={randomId} style={PLItemNameStyle}>
      {props.name}
    </label>
    <div id={randomId} style={PLItemValueStyle}>
      {props.value}
    </div>
  </div>;
}

const PLInput2 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);
  let disabled = props.disabled || false;

  return <div style={PLItemStyle}>
    <label htmlFor={randomId} style={PLItemNameStyle}>
      {props.name}
    </label>
    <input
      id={randomId}
      disabled={disabled}
      value={props.state[props.valueName]}
      onChange={props.onChange(props.valueName)}
      style={PLItemValueStyle} />
  </div>;
}

const PLSelect2 = (props) => {
  let randomId = Math.random().toString(36).substr(2, 11);
  let disabled = props.disabled || false;

  return <div style={PLItemStyle}>
    <label htmlFor={randomId} style={PLItemNameStyle}>
      {props.name}
    </label>
    <select
      id={randomId}
      disabled={disabled}
      value={props.state[props.valueName]}
      onChange={props.onChange(props.valueName)}
      style={PLItemValueStyle}>
      {props.children}
    </select>
  </div>;
}

export { PLHeader2, PLItem2, PLInput2, PLSelect2 };
