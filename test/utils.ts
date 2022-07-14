import { ethers, upgrades } from 'hardhat';
import { ContractAddressOrInstance } from '@openzeppelin/hardhat-upgrades/dist/utils';

export const deployUUPS = async (
  name: string,
  parameters: Array<unknown> = []
): Promise<any> => {
  const factory = await ethers.getContractFactory(name);
  const instance = await upgrades.deployProxy(factory, parameters, {
    kind: 'uups',
  });
  await instance.deployed();
  return instance;
};

export const upgrade = async (
  proxy: ContractAddressOrInstance,
  name: string
): Promise<any> => {
  const factory = await ethers.getContractFactory(name);
  return upgrades.upgradeProxy(proxy, factory);
};

export const MINTER_ROLE = ethers.utils.solidityKeccak256(
  ['string'],
  ['MINTER_ROLE']
);
export const DEVELOPER_ROLE = ethers.utils.solidityKeccak256(
  ['string'],
  ['DEVELOPER_ROLE']
);

export const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
