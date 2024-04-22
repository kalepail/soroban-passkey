import XCTest
@testable import Plugin

class WebAuthnTests: XCTestCase {
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }

    func testIsWebAuthnAvailable() {
        let implementation = WebAuthn()
        let value = false
        let result = implementation.isWebAuthnAvailable()
        XCTAssertEqual(value, result)
    }
    
    func testIsWebAuthnAutoFillAvailable() {
        let implementation = WebAuthn()
        let value = false
        let result = implementation.isWebAuthnAutoFillAvailable()
        XCTAssertEqual(value, result)
    }
}
