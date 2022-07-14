import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import {
  DEFAULT_ADMIN_ROLE,
  DEVELOPER_ROLE,
  MINTER_ROLE,
  upgrade,
  deployUUPS,
} from './utils';

import { InterestToken, TestInterestTokenV2 } from '../typechain-types';

async function deployFixture() {
  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount] = await ethers.getSigners();

  const interestToken: InterestToken = await deployUUPS('InterestToken');

  return {
    interestToken,
    developerRole: DEVELOPER_ROLE,
    minterRole: MINTER_ROLE,
    adminRole: DEFAULT_ADMIN_ROLE,
    owner,
    otherAccount,
  };
}

describe('Interest Token', function () {
  describe('function: initialize', () => {
    it('reverts if you call it after deployment', async () => {
      const { interestToken } = await loadFixture(deployFixture);

      await expect(interestToken.initialize()).to.rejectedWith(
        'Initializable: contract is already initialized'
      );
    });

    it('initializes the state properly', async () => {
      const { interestToken, owner, adminRole, developerRole, minterRole } =
        await loadFixture(deployFixture);

      const [name, symbol] = await Promise.all([
        interestToken.name(),
        interestToken.symbol(),
      ]);

      expect(name).to.be.equal('Interest Token');
      expect(symbol).to.be.equal('XIP');

      expect(await interestToken.hasRole(adminRole, owner.address)).to.be.equal(
        true
      );
      expect(
        await interestToken.hasRole(developerRole, owner.address)
      ).to.be.equal(true);
      expect(
        await interestToken.hasRole(minterRole, owner.address)
      ).to.be.equal(false);
    });
  });

  describe('function: mint', () => {
    it('reverts if it is not called by an account with the proper role', async () => {
      const { interestToken, otherAccount } = await loadFixture(deployFixture);

      await expect(
        interestToken.connect(otherAccount).mint(otherAccount.address, 1000)
      ).to.rejectedWith(
        'AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
      );
    });

    it('mints tokens to an account', async () => {
      const { interestToken, otherAccount, owner, minterRole } =
        await loadFixture(deployFixture);

      await interestToken
        .connect(owner)
        .grantRole(minterRole, otherAccount.address);

      await expect(
        interestToken.connect(otherAccount).mint(owner.address, 1000)
      )
        .to.emit(interestToken, 'Transfer')
        .withArgs(ethers.constants.AddressZero, owner.address, 1000);
    });
  });

  it('allows an accoun tto burn its own tokens', async () => {
    const { interestToken, otherAccount, minterRole } = await loadFixture(
      deployFixture
    );

    await interestToken.grantRole(minterRole, otherAccount.address);

    interestToken.connect(otherAccount).mint(otherAccount.address, 1000);

    await expect(interestToken.connect(otherAccount).burn(500))
      .to.emit(interestToken, 'Transfer')
      .withArgs(otherAccount.address, ethers.constants.AddressZero, 500);
  });

  describe('function: burnFrom', () => {
    it('reverts if the spender burns more than his/her allowance', async () => {
      const { interestToken, otherAccount, minterRole, owner } =
        await loadFixture(deployFixture);

      await interestToken.grantRole(minterRole, otherAccount.address);

      interestToken.connect(otherAccount).mint(otherAccount.address, 1000);

      await expect(
        interestToken.burnFrom(otherAccount.address, 500)
      ).to.rejectedWith('ERC20: insufficient allowance');

      await interestToken.connect(otherAccount).approve(owner.address, 499);

      await expect(
        interestToken.burnFrom(otherAccount.address, 500)
      ).to.rejectedWith('ERC20: insufficient allowance');
    });

    it('allows a spender to burn his/her allowance', async () => {
      const { interestToken, otherAccount, minterRole, owner } =
        await loadFixture(deployFixture);

      await interestToken.grantRole(minterRole, otherAccount.address);

      interestToken.connect(otherAccount).mint(otherAccount.address, 1000);

      await interestToken.connect(otherAccount).approve(owner.address, 500);

      await expect(interestToken.burnFrom(otherAccount.address, 500))
        .to.emit(interestToken, 'Transfer')
        .withArgs(otherAccount.address, ethers.constants.AddressZero, 500);
    });
  });

  describe('Upgrades to V2', () => {
    it('reverts if an account tries to update without the developer role', async () => {
      const { interestToken, developerRole, owner } = await loadFixture(
        deployFixture
      );

      await interestToken.revokeRole(developerRole, owner.address);

      await expect(
        upgrade(interestToken, 'TestInterestTokenV2')
      ).to.rejectedWith(
        'AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x4504b9dfd7400a1522f49a8b4a100552da9236849581fd59b7363eb48c6a474c'
      );
    });

    it('upgrades to a new version', async () => {
      const { interestToken, minterRole, otherAccount } = await loadFixture(
        deployFixture
      );

      await interestToken.grantRole(minterRole, otherAccount.address);

      await interestToken
        .connect(otherAccount)
        .mint(otherAccount.address, 1000);

      const interestTokenV2: TestInterestTokenV2 = await upgrade(
        interestToken,
        'TestInterestTokenV2'
      );

      const [otherAccountBalance, version] = await Promise.all([
        interestTokenV2.balanceOf(otherAccount.address),
        interestTokenV2.version(),
      ]);

      expect(otherAccountBalance).to.be.equal(1000);
      expect(version).to.be.equal('V2');
    });
  });
});
