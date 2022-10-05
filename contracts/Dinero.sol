// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Dinero is
    Initializable,
    AccessControlUpgradeable,
    ERC20PermitUpgradeable,
    UUPSUpgradeable
{
    /*///////////////////////////////////////////////////////////////
                                ROLES
    //////////////////////////////////////////////////////////////*/

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DEVELOPER_ROLE = keccak256("DEVELOPER_ROLE");

    /*///////////////////////////////////////////////////////////////
                            INITIALIZER
    //////////////////////////////////////////////////////////////*/

    /**
     * Requirements:
     *
     * - Can only be called at once and should be called during creation to prevent front running.
     */
    function initialize() external initializer {
        __ERC20_init("Dinero", "DNR");
        __ERC20Permit_init("Dinero");

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(DEVELOPER_ROLE, _msgSender());
    }

    /*///////////////////////////////////////////////////////////////
                        ROLE BASED FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Creates `amount` of tokens for the `account` address.
     *
     * @notice Markets and Vaults contracts will create `Dinero` to lend to borrowers or as a receipt token to a basket of tokens.
     *
     * @param account The address to whom the new tokens will be created to.
     * @param amount The number of tokens to create.
     *
     * Requirements:
     *
     * - The caller must have the `MINTER_ROLE`
     */
    function mint(address account, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        _mint(account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`. Only callable by the `BURNER_ROLE` role.
     *
     * @notice Only contracts can have access to this role as it can burn tokens from any account.
     *
     * @param account The address whom the tokens will be burned
     * @param amount The number of `DINERO` tokens to burn
     *
     * Requirements:
     *
     * - The caller must have the `MINTER_ROLE`
     */
    function burn(address account, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
    {
        _burn(account, amount);
    }

    /**
     * @dev A hook to guard the address that can update the implementation of this contract. It must have the {DEVELOPER_ROLE}.
     */
    function _authorizeUpgrade(address)
        internal
        view
        override
        onlyRole(DEVELOPER_ROLE)
    //solhint-disable-next-line no-empty-blocks
    {

    }
}
