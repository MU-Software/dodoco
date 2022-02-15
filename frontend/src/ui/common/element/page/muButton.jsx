import 'bootstrap/dist/css/bootstrap.min.css';
import { Button } from "react-bootstrap";

/** @type { React.CSSProperties } */
const PHButtonStyle = {
  margin: 0.25 + 'rem',
}

const PHButton = (props) => {
  let variant = props.variant || 'outline-primary';
  let buttonDisabled = props.disabled || false;
  let buttonType = props.type || 'button'
  let buttonSize = (props.size === 'extra-sm' ? 'sm' : props.size) || 'sm'
  let buttonStyle = (props.smaller || props.size === 'extra-sm')
    ? {
      ...PHButtonStyle,
      width: props.width,
      height: props.height,
      padding: '0rem 0.25rem',
      fontSize: 0.75 + 'rem',
    }
    : {
      ...PHButtonStyle,
      width: props.width,
      height: props.height,
    };

  let attrCollection = {
    disabled: buttonDisabled,
    onClick: props.onClick,
    size: buttonSize,
    style: buttonStyle,
    type: buttonType,
    variant: variant,
  }

  return <Button {...attrCollection}>
    {props.children}
  </Button>
};

export { PHButton };
