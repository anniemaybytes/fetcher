import { SinonSandbox, createSandbox } from 'sinon';
import { expect } from 'chai';
import { Group } from './group';
import { Show } from './show';

describe('Show', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('loadShows', () => {
    beforeEach(() => {
      Group.groups.test = {
        shows: [],
      } as any;
    });

    it('creates expected shows and adds them to existing matching groups', () => {
      Show.loadShows({
        'show name': {
          form: {
            groupid: 'groupID',
          },
          formats: ['format'],
          releasers: {
            test: {
              regex: '^yes$',
              media: 'media',
              subbing: 'subbing',
            },
          },
        },
      });
      const show = Group.groups.test.shows[0];
      expect(show).to.not.be.undefined;
      expect(show.name).to.equal('show name');
      expect(show.groupID).to.equal('groupID');
      expect(show.wantedResolutions).to.deep.equal(['format']);
      expect(show.releasers.test.media).to.equal('media');
      expect(show.releasers.test.subbing).to.equal('subbing');
      expect(show.releasers.test.regex.test('yes')).to.be.true;
    });

    it('throws an error if show contains releaser that does not exist', () => {
      try {
        Show.loadShows({
          'show name': {
            form: {
              groupid: 'groupID',
            },
            formats: ['format'],
            releasers: {
              DOESNOTEXIST: {
                regex: '^yes$',
                media: 'media',
                subbing: 'subbing',
              },
            },
          },
        });
      } catch (e) {
        return;
      }
      expect.fail('did not throw');
    });
  });
});
