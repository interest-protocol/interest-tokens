// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

import '@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-IERC20PermitUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol';

interface InterestTokenInterface is IERC20PermitUpgradeable, IERC20Upgradeable {
    function MINTER_ROLE() external view returns (bytes32);

    function DEVELOPER_ROLE() external view returns (bytes32);

    function mint(address account, uint256 amount) external;

    function burn(uint256 amount) external;

    function burnFrom(address account, uint256 amount) external;
}
