/* eslint-disable import/no-named-as-default-member */
import sinon from 'sinon';
import { expect } from '../chai.js';
import {
  _formatDetails,
  _formatUrlBlocks,
  _format
} from '../../lib/audit-performance-gpsi/index.js';

describe('performance-gpsi', function () {
  describe('#_formatDetails()', function () {
    it('should return undefined 1', function () {
      const details = {};
      const results = _formatDetails(details);
      expect(results).to.be.undefined;
    });
    it('should return undefined 2', function () {
      const details = undefined;
      const results = _formatDetails(details);
      expect(results).to.be.undefined;
    });
    it('should return undefined 3', function () {
      const details = null;
      const results = _formatDetails(details);
      expect(results).to.be.undefined;
    });
    it('should return a details object with an no link', function () {
      const details = {
        format: 'format_text'
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text'
      });
    });
    it('should return a details object with a text+link', function () {
      const details = {
        format: 'format_text',
        args: [
          {
            type: 'HYPERLINK',
            key: 'LINK',
            value: 'link_text'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text',
        link: 'link_text'
      });
    });
    it('should return a details object with a text+link and removes the {{BEGIN_LINK}}', function () {
      const details = {
        format: 'format_text{{BEGIN_LINK}}',
        args: [
          {
            type: 'HYPERLINK',
            key: 'LINK',
            value: 'link_text'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text',
        link: 'link_text'
      });
    });
    it('should return a details object with a text+link with an inserted literal', function () {
      const details = {
        format: 'format_text{{TEST}}',
        args: [
          {
            type: 'INT_LITERAL',
            key: 'TEST',
            value: 'text'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_texttext'
      });
    });
    it('should replace the bytes value in the text', function () {
      const details = {
        format: 'format_text {{SIZE_IN_BYTES}}',
        args: [
          {
            type: 'BYTES',
            key: 'SIZE_IN_BYTES',
            value: 'bytes'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text bytes'
      });
    });
    it('should replace the percentage value in the text', function () {
      const details = {
        format: 'format_text {{PERCENTAGE}}',
        args: [
          {
            type: 'PERCENTAGE',
            key: 'PERCENTAGE',
            value: 'percent'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text percent'
      });
    });
    it('should replace the url value in the text', function () {
      const details = {
        format: 'format_text {{URL}}',
        args: [
          {
            type: 'URL',
            key: 'URL',
            value: 'url'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text url',
        link: 'url'
      });
    });
    it('should replace the duration value in the text', function () {
      const details = {
        format: 'format_text {{LIFETIME}}',
        args: [
          {
            type: 'DURATION',
            key: 'LIFETIME',
            value: 'duration'
          }
        ]
      };
      const results = _formatDetails(details);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text duration'
      });
    });
    it('should return a details object with a text if unknown arg type', function () {
      const details = {
        format: 'format_text',
        args: [{ type: 'XXXXXXX', key: 'TEST', value: 'text' }]
      };
      const results = _formatDetails(details, () => {});
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal({
        text: 'format_text'
      });
    });
    it('should call a callback if unknown arg type', function () {
      const callback = sinon.spy();
      const type = 'XXXXXXX';
      const details = {
        format: 'format_text',
        args: [{ type: type, key: 'TEST', value: 'text' }]
      };
      const results = _formatDetails(details, callback);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(callback.called).to.be.true;
      expect(callback.calledWith(type)).to.be.true;
    });
  });
  describe('#_formatUrlBlocks()', function () {
    it('should return an empty array 1', function () {
      const blocks = { urlBlocks: [{}] };
      const results = _formatUrlBlocks(blocks);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.be.empty;
    });
    it('should return an empty array 2', function () {
      const blocks = {};
      const results = _formatUrlBlocks(blocks);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.be.empty;
    });
    it('should return an empty array 3', function () {
      const blocks = { urlBlocks: [] };
      const results = _formatUrlBlocks(blocks);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.be.empty;
    });
    it('should return an array of details from a urlBlocks', function () {
      const blocks = {
        urlBlocks: [
          {
            header: {
              format: '1',
              args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
            },
            urls: [
              {
                result: {
                  format: '2',
                  args: [
                    { type: 'HYPERLINK', key: 'LINK', value: 'link_text' },
                    { type: 'HYPERLINK', key: 'LINK', value: 'link_text' }
                  ]
                }
              },
              {
                result: {
                  format: '3',
                  args: [
                    { type: 'HYPERLINK', key: 'LINK', value: 'link_text' },
                    { type: 'HYPERLINK', key: 'LINK', value: 'link_text' }
                  ]
                }
              }
            ]
          }
        ]
      };
      const results = _formatUrlBlocks(blocks);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.not.be.empty;
      expect(results).to.deep.equal([
        {
          text: '1',
          link: 'link_text',
          urls: [
            { text: '2', link: 'link_text' },
            { text: '3', link: 'link_text' }
          ]
        }
      ]);
    });
  });
  describe('#_format()', function () {
    it('should return an list of 1 formatted rule', function () {
      const rules = {
        GpsiRule1: {
          localizedRuleName: 'local name',
          score: 0,
          groups: ['group'],
          summary: {
            format: '1',
            args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
          }
        }
      };
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.have.lengthOf(1);
    });
    it('should return an list of 2 formatted rules', function () {
      const rules = {
        GpsiRule1: {
          localizedRuleName: 'local name',
          score: 0,
          groups: ['group'],
          summary: {
            format: '1',
            args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
          }
        },
        GpsiRule2: {
          localizedRuleName: 'local name',
          score: 0,
          groups: ['group'],
          summary: {
            format: '1',
            args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
          }
        }
      };
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.have.lengthOf(2);
    });
    it('should include the rule name', function () {
      const rules = {
        GpsiRule1: {
          localizedRuleName: 'local name',
          score: 0,
          groups: ['group'],
          summary: {
            format: '1',
            args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
          }
        }
      };
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results[0].rule).to.equal('GpsiRule1');
    });
    it('should include set the rules as checked if score is 1', function () {
      const rules = {
        GpsiRule1: {
          localizedRuleName: 'local name',
          score: 1,
          groups: ['group'],
          summary: {
            format: '1',
            args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
          }
        }
      };
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results[0].check).to.equal(true);
    });
    it('should include set the rules as not checked if score is < 1', function () {
      const rules = {
        GpsiRule1: {
          localizedRuleName: 'local name',
          score: 0,
          groups: ['group'],
          summary: {
            format: '1',
            args: [{ type: 'HYPERLINK', key: 'LINK', value: 'link_text' }]
          }
        }
      };
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results[0].check).to.equal(false);
    });
    it('should return an empty object 1', function () {
      const rules = {
        GpsiRule1: {}
      };
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.be.empty;
    });
    it('should return an empty object 2', function () {
      const rules = {};
      const results = _format(rules);
      expect(results).to.exist;
      expect(results).to.not.be.undefined;
      expect(results).to.be.empty;
    });
  });
});
