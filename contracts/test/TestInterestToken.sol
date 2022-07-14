// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import '../InterestToken.sol';

contract TestInterestTokenV2 is InterestToken {
    function version() external pure returns (string memory) {
        return 'V2';
    }
}
