import React from 'react';

/** @type { React.CSSProperties } */
const CanvasStyle = {
  width: 100 + '%',
  height: 100 + '%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}

/** @type { React.CSSProperties } */
const CanvasTitleStyle = {
  width: 70 + '%',
  minWidth: 400 + 'px',
  textAlign: 'left',
  fontSize: 24 + 'pt',
  padding: 0.5 + 'vw',
  paddingLeft: 1 + 'vw',
  paddingRight: 1 + 'vw',
}

/** @type { React.CSSProperties } */
const PageContainerStyle = {
  width: 70 + '%',
  minWidth: 400 + 'px',
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
}

const CanvasTemplate = (props) => <div style={CanvasStyle}>
  <h1 style={CanvasTitleStyle}>{props.title}</h1>
  <div style={PageContainerStyle}>
    {props.children}
  </div>
</div>;

export { CanvasTemplate };
