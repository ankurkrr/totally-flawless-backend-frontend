#import "TestFlightCheck.h"
#import <React/RCTLog.h>

@implementation TestFlightCheck

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(isTestFlight:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    NSURL *receiptURL = [[NSBundle mainBundle] appStoreReceiptURL];
    NSString *receiptPath = [receiptURL path];
    
    BOOL isTestFlight = [receiptPath rangeOfString:@"sandboxReceipt"].location != NSNotFound;
    
    resolve(@(isTestFlight));
}

// Ensure this runs on the main queue if needed, though for this check it's not strictly required.
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

@end
