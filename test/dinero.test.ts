import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import { Dinero, TestDineroV2 } from '../typechain-types';

import {
  deployUUPS,
  DEVELOPER_ROLE,
  MINTER_ROLE,
  DEFAULT_ADMIN_ROLE,
  upgrade,
} from './utils';

async function deployDineroFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  const dinero: Dinero = await deployUUPS('Dinero');

  return {
    dinero,
    developerRole: DEVELOPER_ROLE,
    minterRole: MINTER_ROLE,
    adminRole: DEFAULT_ADMIN_ROLE,
    owner,
    otherAccount,
  };
}

describe('Dinero', function () {
  describe('function: initialize', () => {
    it('reverts if you call it after deployment', async () => {
      const { dinero } = await loadFixture(deployDineroFixture);

      await expect(dinero.initialize()).to.rejectedWith(
        'Initializable: contract is already initialized'
      );
    });

    it('initializes the state properly', async () => {
      const { dinero, owner, adminRole, developerRole, minterRole } =
        await loadFixture(deployDineroFixture);

      const [name, symbol] = await Promise.all([
        dinero.name(),
        dinero.symbol(),
      ]);

      expect(name).to.be.equal('Dinero');
      expect(symbol).to.be.equal('DNR');

      expect(await dinero.hasRole(adminRole, owner.address)).to.be.equal(true);
      expect(await dinero.hasRole(developerRole, owner.address)).to.be.equal(
        true
      );
      expect(await dinero.hasRole(minterRole, owner.address)).to.be.equal(
        false
      );
    });
  });

  describe('function: mint', () => {
    it('reverts if it is not called by an account with the proper role', async () => {
      const { dinero, otherAccount } = await loadFixture(deployDineroFixture);

      await expect(
        dinero.connect(otherAccount).mint(otherAccount.address, 1000)
      ).to.rejectedWith(
        'AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      );
    });

    it('mints tokens to an account', async () => {
      const { dinero, otherAccount, owner, minterRole } = await loadFixture(
        deployDineroFixture
      );

      await dinero.connect(owner).grantRole(minterRole, otherAccount.address);

      await expect(dinero.connect(otherAccount).mint(owner.address, 1000))
        .to.emit(dinero, 'Transfer')
        .withArgs(ethers.constants.AddressZero, owner.address, 1000);
    });
  });

  describe('function: burn', () => {
    it('reverts if it is not called by an account with the proper role', async () => {
      const { dinero, owner, otherAccount, minterRole } = await loadFixture(
        deployDineroFixture
      );

      await dinero.connect(owner).grantRole(minterRole, otherAccount.address);

      await dinero.connect(otherAccount).mint(owner.address, 1000);

      await expect(
        dinero.connect(owner).burn(owner.address, 500)
      ).to.rejectedWith(
        'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      );
    });

    it('burns tokens from an account', async () => {
      const { dinero, otherAccount, owner, minterRole } = await loadFixture(
        deployDineroFixture
      );

      await dinero.connect(owner).grantRole(minterRole, otherAccount.address);

      await dinero.connect(otherAccount).mint(owner.address, 1000);

      await expect(dinero.connect(otherAccount).burn(owner.address, 700))
        .to.emit(dinero, 'Transfer')
        .withArgs(owner.address, ethers.constants.AddressZero, 700);
    });
  });

  describe('Upgrades to V2', () => {
    it('reverts if an account tries to update without the developer role', async () => {
      const { dinero, developerRole, owner } = await loadFixture(
        deployDineroFixture
      );

      await dinero.revokeRole(developerRole, owner.address);

      await expect(upgrade(dinero, 'TestDineroV2')).to.rejectedWith(
        'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x4504b9dfd7400a1522f49a8b4a100552da9236849581fd59b7363eb48c6a474c'
      );
    });

    it('upgrades to a new versio', async () => {
      const { dinero, minterRole, otherAccount } = await loadFixture(
        deployDineroFixture
      );

      await dinero.grantRole(minterRole, otherAccount.address);

      await dinero.connect(otherAccount).mint(otherAccount.address, 1000);

      const dineroV2: TestDineroV2 = await upgrade(dinero, 'TestDineroV2');

      const [otherAccountBalance, version] = await Promise.all([
        dineroV2.balanceOf(otherAccount.address),
        dineroV2.version(),
      ]);

      expect(otherAccountBalance).to.be.equal(1000);
      expect(version).to.be.equal('V2');
    });
  });
});
