import React from 'react';

import { Divider } from '@ui/common/element/divider';
import { PHButton } from '@ui/common/element/page/muButton';

/** @type { React.CSSProperties } */
const PageStyle = {
  flexGrow: 1,
  margin: 1 + 'vw',
  borderBottom: '3px solid #bbb',
  paddingBottom: 16 + 'px',
}

/** @type { React.CSSProperties } */
const PageHeaderTitle = {
  paddingBottom: 0,
}

/** @type { React.CSSProperties } */
const PageHeaderButtonContainerStyle = {
  padding: 0,
  paddingLeft: 3 + 'vw',
  paddingRight: 3 + 'vw',
  display: 'flex',
  justifyContent: 'flex-end',
}

const PageTemplate = (props) => <div className="card" style={PageStyle}>
  <div>
    <div className="card-body" style={PageHeaderTitle}>
      <h4 className="card-title">{props.title}</h4>
    </div>
    {(props.actionButton != undefined && props.actionButton.length > 0) && <div style={PageHeaderButtonContainerStyle}>
      {props.actionButton}
    </div>}
    <Divider />
    <form>
      {props.children}
    </form>
  </div>
</div>;

export { PageTemplate };
