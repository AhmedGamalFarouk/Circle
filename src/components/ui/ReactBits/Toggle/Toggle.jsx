import React from "react";
import styled from "styled-components";

const Switch = () => {
  return (
    <StyledWrapper>
      <div className="checkbox-apple">
        <input className="yep" id="check-apple" type="checkbox" />
        <label htmlFor="check-apple" />
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .checkbox-apple {
    position: relative;
    width: 50px;
    height: 25px;
    margin:20px 0;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .checkbox-apple label {
    position: absolute;
    top: 0;
    left: 0;
    width: 50px;
    height: 25px;
    border-radius: 50px;
    background: linear-gradient(to bottom, #b3b3b3, #e6e6e6);
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .checkbox-apple label:after {
    content: "";
    position: absolute;
    top: 1px;
    left: 1px;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .checkbox-apple input[type="checkbox"]:checked + label {
    background: linear-gradient(to bottom, #4cd964, #5de24e);
  }

  .checkbox-apple input[type="checkbox"]:checked + label:after {
    transform: translateX(25px);
  }

  .checkbox-apple label:hover {
    background: linear-gradient(to bottom, #b3b3b3, #e6e6e6);
  }

  .checkbox-apple label:hover:after {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .yep {
    position: absolute;
    top: 0;
    left: 0;
    width: 50px;
    height: 25px;
  }
`;

export default Switch;
