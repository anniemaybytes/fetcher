import { createSandbox, SinonSandbox } from 'sinon';
import { expect } from 'chai';
import * as mediainfo from './mediainfo';

describe('mediainfo', () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('parseMediaInfoJSON', () => {
    it('throws an error if the result is for multiple files', () => {
      try {
        mediainfo.parseMediaInfoJSON([{ media: {} }, { media: {} }]);
        expect.fail('Did not throw');
      } catch (e) {
        expect(String(e)).to.equal('Error: non-singular number of files 2');
      }
    });

    describe('video', () => {
      it('changes mpeg video to MPEG-2', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'MPEG video' }] } });
        expect(result.codec).to.equal('MPEG-2');
      });
      it('changes xvid to XviD', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'xvid' }] } });
        expect(result.codec).to.equal('XviD');
      });
      it('changes divx types to DivX', () => {
        const result1 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'div3' }] } });
        const result2 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'divx' }] } });
        const result3 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'dx50' }] } });
        expect(result1.codec).to.equal('DivX');
        expect(result2.codec).to.equal('DivX');
        expect(result3.codec).to.equal('DivX');
      });
      it('changes x264 to h264', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'x264' }] } });
        expect(result.codec).to.equal('h264');
      });
      it('changes avc to h264', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'avc something' }] } });
        expect(result.codec).to.equal('h264');
      });
      it('changes hevc to h265', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'hevc something' }] } });
        expect(result.codec).to.equal('h265');
      });
      it('adds 10 bit if 10 bit and h264/5', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'x264', BitDepth: '10' }] } });
        expect(result.codec).to.equal('h264 10-bit');
      });
      it('Does not add 10 bit if 10 bit and NOT h264/5', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Video', Format: 'divx', BitDepth: '10' }] } });
        expect(result.codec).to.equal('DivX');
      });
    });
    describe('audio', () => {
      it('changes mpeg audio to MP3', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'MPEG audio' }] } });
        expect(result.audio).to.equal('MP3');
      });
      it('changes ac-3 to AC3', () => {
        const result = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3' }] } });
        expect(result.audio).to.equal('AC3');
      });
      it('converts audio channels', () => {
        const result1 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '1' }] } });
        const result2 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '1.0' }] } });
        const result3 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '2' }] } });
        const result4 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '2.0' }] } });
        const result5 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '2.1' }] } });
        const result6 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '3' }] } });
        const result7 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '5' }] } });
        const result8 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '5.0' }] } });
        const result9 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '5.1' }] } });
        const result10 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '6' }] } });
        const result11 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '6.1' }] } });
        const result12 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '7' }] } });
        const result13 = mediainfo.parseMediaInfoJSON({ media: { track: [{ '@type': 'Audio', Format: 'ac-3', Channels: '7.1' }] } });
        expect(result1.audiochannels).to.equal('1.0');
        expect(result2.audiochannels).to.equal('1.0');
        expect(result3.audiochannels).to.equal('2.0');
        expect(result4.audiochannels).to.equal('2.0');
        expect(result5.audiochannels).to.equal('2.1');
        expect(result6.audiochannels).to.equal('2.1');
        expect(result7.audiochannels).to.equal('5.0');
        expect(result8.audiochannels).to.equal('5.0');
        expect(result9.audiochannels).to.equal('5.1');
        expect(result10.audiochannels).to.equal('5.1');
        expect(result11.audiochannels).to.equal('6.1');
        expect(result12.audiochannels).to.equal('6.1');
        expect(result13.audiochannels).to.equal('7.1');
      });
    });
  });
});
