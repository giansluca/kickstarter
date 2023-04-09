/// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract CampaignFactory {
    
    address[] public deployedCampaigns;
    
    function deployCampaign(uint minimum) public {
        Campaign newCampaign = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(address(newCampaign));
    }
    
    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {
    
    struct Request {
        string description;
        uint value;
        address payable recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }
    
    uint public requestCount = 0;
    mapping (uint => Request) public requests;
    address public manager;
    uint public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount = 0;
    
    constructor(uint _minimum, address _creator) {
        manager = _creator;
        minimumContribution = _minimum;
    }
    
    function contribute() public payable {
        require(msg.value > minimumContribution);
        
        approvers[msg.sender] = true;
        approversCount++;
    }
    
    function createRequest(string memory _description, uint _value, address payable _recipient) public restricted {
        Request storage request = requests[requestCount++];
        request.description = _description;
        request.value = _value;
        request.recipient = _recipient;
        request.complete = false;
        request.approvalCount = 0;
    }
    
    function approveRequest(uint _index) public {
        Request storage request = requests[_index];
        
        require(approvers[msg.sender]);
        require(!request.approvals[msg.sender]);
        
        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }
    
    function finalizeRequest(uint _index) public restricted {
        Request storage request = requests[_index];
        
        require(request.approvalCount > (approversCount / 2));
        require(!request.complete);
        
        request.recipient.transfer(request.value);
        request.complete = true;
    }
    
    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function getSummary() public view returns(
        uint, uint, uint, uint, address
    ) {
        return (
            minimumContribution,
            address(this).balance,
            requestCount,
            approversCount,
            manager
        );
    }

    function getRequestCount() public view returns(uint) {
        return requestCount;
    }
    
}









