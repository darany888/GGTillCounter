import React from 'react';
import logo from '../assets/logo.webp';


type Props = {
  title: string;
};

function Header(props: Props): JSX.Element {
  return (
    <header
      className="header"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '10px 0'
      }}
    >
      <img
        src={logo}
        alt="Logo"
        style={{ height: '60px' }}
      />
      <h1 style={{ margin: 0 }}>{props.title}</h1>
    </header>
  );
}

export default Header;
