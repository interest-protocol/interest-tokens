// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import '../Dinero.sol';

contract TestDineroV2 is Dinero {
    function version() external pure returns (string memory) {
        return 'V2';
    }
}
