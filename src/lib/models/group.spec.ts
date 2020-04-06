import { SinonSandbox, createSandbox, SinonStub, assert } from 'sinon';
import { expect } from 'chai';
import { Source } from './sources/source';
import { Group } from './group';

describe('Group', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    Group.groups = {};
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('loadGroups', () => {
    let createSourceStub: SinonStub;

    beforeEach(() => {
      createSourceStub = sandbox.stub(Source, 'createSource');
    });

    it('creates expected groups in static Group storage', () => {
      Group.loadGroups({
        somegroup: {
          name: 'Some Group',
          sources: [],
        },
      } as any);
      expect(Group.groups.somegroup.key).to.equal('somegroup');
      expect(Group.groups.somegroup.name).to.equal('Some Group');
      assert.notCalled(createSourceStub);
    });

    it('creates sources for provided sources in groups', () => {
      Group.loadGroups({
        somegroup: {
          name: 'Some Group',
          sources: [
            {
              'a+b': { some: 'options' },
            },
          ],
        },
      } as any);
      assert.calledOnceWithExactly(createSourceStub, 'a', Group.groups.somegroup, 'b', { some: 'options' });
    });

    it('throws an error if source/fetch type are malformed', () => {
      try {
        Group.loadGroups({
          somegroup: {
            name: 'Some Group',
            sources: [
              {
                MALFORMED: { some: 'options' },
              },
            ],
          },
        } as any);
        expect.fail('did not throw');
      } catch (e) {} // eslint-disable-line no-empty
    });

    it('does not throw if there was an error creating a source', () => {
      createSourceStub.throws(new Error('An error'));
      Group.loadGroups({
        somegroup: {
          name: 'Some Group',
          sources: [
            {
              'a+b': { some: 'options' },
            },
          ],
        },
      } as any);
    });
  });

  describe('findShow', () => {
    let group: Group;

    beforeEach(() => {
      group = new Group('somegroup', { name: 'Some Group', sources: [] });
    });

    it('uses regex of shows to check and return show', () => {
      group.shows = [
        {
          releasers: {
            somegroup: {
              regex: /yes/,
            },
          },
        } as any,
      ];
      expect(group.findShow('yes')).to.equal(group.shows[0]);
    });

    it('returns undefined if there are no found matches', () => {
      group.shows = [
        {
          releasers: {
            somegroup: {
              regex: /yes/,
            },
          },
        } as any,
      ];
      expect(group.findShow('no')).to.be.undefined;
    });
  });
});
